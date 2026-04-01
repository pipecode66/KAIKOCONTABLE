import { Prisma } from "@prisma/client";

import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildJournalEntryFromVoucher } from "@/modules/accounting/domain/services/posting-engine.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { prisma } from "@/lib/prisma/client";
import { DomainError, NotFoundError } from "@/lib/errors";

type PostAccountingVoucherInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  voucherId: string;
  idempotencyKey: string;
  requestHash: string;
};

export async function postAccountingVoucher(input: PostAccountingVoucherInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "accounting_voucher.post",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
    resourceType: "AccountingVoucher",
    resourceId: input.voucherId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const voucher = await accountingCoreRepository.findVoucherById(
            {
              organizationId: input.organizationId,
              voucherId: input.voucherId,
            },
            tx,
          );

          if (!voucher) {
            throw new NotFoundError("No encontramos el voucher solicitado.");
          }

          if (voucher.status !== "DRAFT") {
            throw new DomainError("Solo los vouchers en borrador se pueden postear.", "VOUCHER_NOT_DRAFT");
          }

          if (!voucher.lines.length) {
            throw new DomainError("El voucher no tiene lineas para postear.", "EMPTY_VOUCHER");
          }

          const period = voucher.accountingPeriod;
          assertPeriodIsOpen(period);

          const existingEntry = await accountingCoreRepository.findJournalEntryBySource(
            {
              organizationId: input.organizationId,
              sourceType: "ACCOUNTING_VOUCHER",
              sourceId: voucher.id,
            },
            tx,
          );

          if (existingEntry) {
            return {
              voucherId: voucher.id,
              voucherNumber: voucher.voucherNumber,
              journalEntryId: existingEntry.id,
              journalEntryNumber: existingEntry.entryNumber,
            };
          }

          const fiscalYear = getFiscalYearForDate(voucher.entryDate);
          const [voucherNumber, entryNumber] = await Promise.all([
            accountingCoreRepository.reserveSequenceNumber(
              {
                organizationId: input.organizationId,
                documentType: "accounting_voucher",
                fiscalYear,
              },
              tx,
            ),
            accountingCoreRepository.reserveSequenceNumber(
              {
                organizationId: input.organizationId,
                documentType: "journal_entry",
                fiscalYear,
              },
              tx,
            ),
          ]);

          const posting = buildJournalEntryFromVoucher({
            organizationId: input.organizationId,
            accountingPeriodId: voucher.accountingPeriodId,
            currencyId: voucher.currencyId,
            entryDate: voucher.entryDate,
            sourceType: "ACCOUNTING_VOUCHER",
            sourceId: voucher.id,
            description: voucher.description,
            voucherType: voucher.voucherType,
            lines: voucher.lines.map((line) => ({
              ledgerAccountId: line.ledgerAccountId,
              thirdPartyId: line.thirdPartyId,
              costCenterId: line.costCenterId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          });

          const postedAt = new Date();

          const journalEntry = await accountingCoreRepository.createJournalEntry(
            {
              organizationId: input.organizationId,
              accountingPeriodId: posting.accountingPeriodId,
              currencyId: posting.currencyId,
              entryNumber,
              entryDate: posting.entryDate,
              sourceType: posting.sourceType,
              sourceId: posting.sourceId,
              entryType: posting.entryType,
              description: posting.description,
              totalDebit: new Prisma.Decimal(posting.totalDebit.toString()),
              totalCredit: new Prisma.Decimal(posting.totalCredit.toString()),
              postedAt,
              lines: posting.lines.map((line) => ({
                ledgerAccountId: line.ledgerAccountId,
                thirdPartyId: line.thirdPartyId,
                costCenterId: line.costCenterId,
                description: line.description,
                debit: new Prisma.Decimal(line.debit.toString()),
                credit: new Prisma.Decimal(line.credit.toString()),
              })),
            },
            tx,
          );

          await accountingCoreRepository.updateVoucherAfterPost(
            {
              voucherId: voucher.id,
              organizationId: input.organizationId,
              voucherNumber,
              postedAt,
            },
            tx,
          );

          await accountingCoreRepository.createDocumentLink(
            {
              organizationId: input.organizationId,
              sourceModule: "accounting",
              sourceType: "ACCOUNTING_VOUCHER",
              sourceId: voucher.id,
              accountingVoucherId: voucher.id,
              journalEntryId: journalEntry.id,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "AccountingVoucher",
              entityId: voucher.id,
              correlationId: input.correlationId,
              afterState: {
                voucherNumber,
                status: "POSTED",
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "JournalEntry",
              entityId: journalEntry.id,
              correlationId: input.correlationId,
              afterState: {
                entryNumber: journalEntry.entryNumber,
                sourceType: journalEntry.sourceType,
                sourceId: journalEntry.sourceId,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "accounting.voucher.posted",
              aggregateType: "AccountingVoucher",
              aggregateId: voucher.id,
              correlationId: input.correlationId,
              dedupeKey: `accounting:voucher:posted:${voucher.id}`,
              payload: {
                voucherId: voucher.id,
                voucherNumber,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          return {
            voucherId: voucher.id,
            voucherNumber,
            journalEntryId: journalEntry.id,
            journalEntryNumber: journalEntry.entryNumber,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
