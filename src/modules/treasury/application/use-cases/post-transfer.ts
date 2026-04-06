import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildTransferPostingLines } from "@/modules/accounting/domain/services/operational-posting.service";
import { summarizePosting } from "@/modules/accounting/domain/services/posting-engine.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type PostTransferInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  transferId: string;
  idempotencyKey: string;
  requestHash: string;
};

export async function postTransfer(input: PostTransferInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "transfer.post",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
    resourceType: "Transfer",
    resourceId: input.transferId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const transfer = await treasuryOperationsRepository.findTransferById(
            {
              organizationId: input.organizationId,
              transferId: input.transferId,
            },
            tx,
          );

          if (!transfer) {
            throw new NotFoundError("No encontramos el traslado solicitado.");
          }

          if (transfer.status !== "DRAFT") {
            throw new DomainError("Solo puedes postear traslados en borrador.", "DOCUMENT_NOT_DRAFT");
          }

          const period = await accountingCoreRepository.resolvePeriodByDate(
            {
              organizationId: input.organizationId,
              date: transfer.transferDate,
            },
            tx,
          );

          if (!period) {
            throw new DomainError("No existe un periodo abierto para la fecha del traslado.", "MISSING_PERIOD");
          }

          assertPeriodIsOpen(period);

          const existingEntry = await accountingCoreRepository.findJournalEntryBySource(
            {
              organizationId: input.organizationId,
              sourceType: "TRANSFER",
              sourceId: transfer.id,
            },
            tx,
          );

          if (existingEntry) {
            return {
              transferId: transfer.id,
              reference: transfer.reference,
              journalEntryId: existingEntry.id,
              journalEntryNumber: existingEntry.entryNumber,
            };
          }

          const transferNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "transfer",
              fiscalYear: getFiscalYearForDate(transfer.transferDate),
            },
            tx,
          );

          const entryNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "journal_entry",
              fiscalYear: getFiscalYearForDate(transfer.transferDate),
            },
            tx,
          );

          const postingAccounts = await accountingCoreRepository.resolveOperationalPostingAccounts(
            input.organizationId,
            tx,
          );

          const postingLines = buildTransferPostingLines({
            accounts: postingAccounts,
            description: transfer.reference ?? transferNumber,
            amount: transfer.amount,
            sourceType: transfer.sourceBankAccountId ? "BANK" : "CASH",
            destinationType: transfer.destinationBankAccountId ? "BANK" : "CASH",
          });

          const totals = summarizePosting(postingLines);
          const postedAt = new Date();
          const officialReference =
            transfer.reference && !transfer.reference.startsWith("TR-DRAFT-")
              ? `${transferNumber} · ${transfer.reference}`
              : transferNumber;

          const journalEntry = await accountingCoreRepository.createJournalEntry(
            {
              organizationId: input.organizationId,
              accountingPeriodId: period.id,
              currencyId: transfer.currencyId,
              entryNumber,
              entryDate: transfer.transferDate,
              sourceType: "TRANSFER",
              sourceId: transfer.id,
              entryType: "SYSTEM",
              description: `Traslado ${officialReference}`,
              totalDebit: new Prisma.Decimal(totals.totalDebit.toString()),
              totalCredit: new Prisma.Decimal(totals.totalCredit.toString()),
              postedAt,
              lines: postingLines.map((line) => ({
                ledgerAccountId: line.ledgerAccountId,
                thirdPartyId: line.thirdPartyId ?? null,
                costCenterId: line.costCenterId ?? null,
                description: line.description ?? null,
                debit: new Prisma.Decimal(line.debit.toString()),
                credit: new Prisma.Decimal(line.credit.toString()),
              })),
            },
            tx,
          );

          await treasuryOperationsRepository.markTransferPosted(
            {
              transferId: transfer.id,
              reference: officialReference,
              postedAt,
            },
            tx,
          );

          await accountingCoreRepository.createDocumentLink(
            {
              organizationId: input.organizationId,
              sourceModule: "treasury",
              sourceType: "TRANSFER",
              sourceId: transfer.id,
              journalEntryId: journalEntry.id,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "Transfer",
              entityId: transfer.id,
              correlationId: input.correlationId,
              afterState: {
                reference: officialReference,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "treasury.transfer.posted",
              aggregateType: "Transfer",
              aggregateId: transfer.id,
              correlationId: input.correlationId,
              dedupeKey: `treasury:transfer:posted:${transfer.id}`,
              payload: {
                transferId: transfer.id,
                reference: officialReference,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          return {
            transferId: transfer.id,
            reference: officialReference,
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
