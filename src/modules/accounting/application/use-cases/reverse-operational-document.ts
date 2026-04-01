import { Prisma, type JournalSourceType } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildReversalLines } from "@/modules/accounting/domain/services/reversal.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

type ReverseOperationalDocumentInTransactionInput = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  sourceType: Exclude<JournalSourceType, "ACCOUNTING_VOUCHER">;
  sourceId: string;
  reason: string;
  sourceModule: string;
};

export async function reverseOperationalDocumentInTransaction(
  input: ReverseOperationalDocumentInTransactionInput,
) {
  const original = await accountingCoreRepository.findJournalEntryBySource(
    {
      organizationId: input.organizationId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
    input.tx,
  );

  if (!original) {
    throw new NotFoundError("No encontramos el asiento publicado del documento.");
  }

  if (!original.postedAt) {
    throw new DomainError("Solo puedes revertir documentos ya publicados.", "ENTRY_NOT_POSTED");
  }

  if (original.reversedBy.length > 0) {
    return {
      originalEntry: original,
      reversalEntry: await accountingCoreRepository.findJournalEntryById(
        {
          organizationId: input.organizationId,
          journalEntryId: original.reversedBy[0]!.id,
        },
        input.tx,
      ),
    };
  }

  const reversalDate = new Date();
  const period = await accountingCoreRepository.resolvePeriodByDate(
    {
      organizationId: input.organizationId,
      date: reversalDate,
    },
    input.tx,
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
    input.tx,
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
      sourceType: input.sourceType,
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
    input.tx,
  );

  await accountingCoreRepository.createDocumentLink(
    {
      organizationId: input.organizationId,
      sourceModule: input.sourceModule,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      journalEntryId: reversalEntry.id,
    },
    input.tx,
  );

  await writeAuditLog(
    {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "REVERSED",
      entityType: "JournalEntry",
      entityId: original.id,
      correlationId: input.correlationId,
      metadata: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        reversalEntryId: reversalEntry.id,
        reversalEntryNumber: reversalEntry.entryNumber,
        reason: input.reason,
      },
    },
    input.tx,
  );

  await addOutboxMessage(
    {
      organizationId: input.organizationId,
      eventType: `${input.sourceModule}.document.reversed`,
      aggregateType: input.sourceType,
      aggregateId: input.sourceId,
      correlationId: input.correlationId,
      dedupeKey: `${input.sourceModule}:document:reversed:${input.sourceId}`,
      payload: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        reversalEntryId: reversalEntry.id,
        reason: input.reason,
      },
    },
    input.tx,
  );

  return {
    originalEntry: original,
    reversalEntry,
  };
}
