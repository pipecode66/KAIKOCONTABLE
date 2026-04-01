import { Prisma } from "@prisma/client";

import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildReversalLines } from "@/modules/accounting/domain/services/reversal.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";

type ReverseJournalEntryInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  journalEntryId: string;
  reason: string;
  idempotencyKey: string;
  requestHash: string;
  voidVoucherId?: string;
};

export async function reverseJournalEntry(input: ReverseJournalEntryInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "journal_entry.reverse",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
    resourceType: "JournalEntry",
    resourceId: input.journalEntryId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const original = await accountingCoreRepository.findJournalEntryById(
            {
              organizationId: input.organizationId,
              journalEntryId: input.journalEntryId,
            },
            tx,
          );

          if (!original) {
            throw new NotFoundError("No encontramos el asiento solicitado.");
          }

          if (!original.postedAt) {
            throw new DomainError("Solo puedes revertir asientos ya publicados.", "ENTRY_NOT_POSTED");
          }

          if (original.reversedBy.length > 0) {
            return {
              journalEntryId: original.reversedBy[0]?.id ?? original.id,
              sourceJournalEntryId: original.id,
            };
          }

          const reversalDate = new Date();
          const period = await accountingCoreRepository.resolvePeriodByDate(
            {
              organizationId: input.organizationId,
              date: reversalDate,
            },
            tx,
          );

          if (!period) {
            throw new DomainError("No existe un periodo abierto para registrar la reversion.", "MISSING_PERIOD");
          }

          assertPeriodIsOpen(period);

          const entryNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "journal_entry",
              fiscalYear: getFiscalYearForDate(reversalDate),
            },
            tx,
          );

          const reversalLines = buildReversalLines(
            original.lines.map((line) => ({
              ledgerAccountId: line.ledgerAccountId,
              thirdPartyId: line.thirdPartyId,
              costCenterId: line.costCenterId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          );

          const reversalEntry = await accountingCoreRepository.createJournalEntry(
            {
              organizationId: input.organizationId,
              accountingPeriodId: period.id,
              currencyId: original.currencyId,
              entryNumber,
              entryDate: reversalDate,
              sourceType: original.sourceType,
              sourceId: `reversal:${original.id}`,
              entryType: "REVERSAL",
              description: `Reversion ${original.entryNumber}: ${input.reason}`,
              totalDebit: original.totalCredit,
              totalCredit: original.totalDebit,
              reversalOfId: original.id,
              reversalReason: input.reason,
              postedAt: reversalDate,
              lines: reversalLines.map((line) => ({
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

          if (original.sourceType === "ACCOUNTING_VOUCHER") {
            const voucherId = input.voidVoucherId ?? original.sourceId;
            const voucher = await accountingCoreRepository.findVoucherById(
              {
                organizationId: input.organizationId,
                voucherId,
              },
              tx,
            );

            if (voucher && voucher.status !== "VOIDED") {
              await accountingCoreRepository.markVoucherVoided(
                {
                  voucherId: voucher.id,
                  voidedAt: reversalDate,
                  voidReason: input.reason,
                },
                tx,
              );
            }

            await accountingCoreRepository.createDocumentLink(
              {
                organizationId: input.organizationId,
                sourceModule: "accounting",
                sourceType: "ACCOUNTING_VOUCHER",
                sourceId: voucherId,
                accountingVoucherId: voucherId,
                journalEntryId: reversalEntry.id,
              },
              tx,
            );
          }

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "REVERSED",
              entityType: "JournalEntry",
              entityId: original.id,
              correlationId: input.correlationId,
              metadata: {
                reversalEntryId: reversalEntry.id,
                reversalEntryNumber: reversalEntry.entryNumber,
                reason: input.reason,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "accounting.journal.reversed",
              aggregateType: "JournalEntry",
              aggregateId: original.id,
              correlationId: input.correlationId,
              dedupeKey: `accounting:journal:reversed:${original.id}`,
              payload: {
                journalEntryId: original.id,
                reversalEntryId: reversalEntry.id,
                reason: input.reason,
              },
            },
            tx,
          );

          return {
            journalEntryId: reversalEntry.id,
            sourceJournalEntryId: original.id,
            reversalEntryNumber: reversalEntry.entryNumber,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
