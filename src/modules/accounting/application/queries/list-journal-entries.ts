import type { JournalEntryListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

export async function listJournalEntries(organizationId: string): Promise<JournalEntryListItemDto[]> {
  const rows = await accountingCoreRepository.listJournalEntries(organizationId);

  return rows.map((row) => ({
    id: row.id,
    entryNumber: row.entryNumber,
    entryDateIso: row.entryDate.toISOString(),
    description: row.description,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    entryType: row.entryType,
    totalDebit: row.totalDebit.toString(),
    totalCredit: row.totalCredit.toString(),
    postedAtIso: row.postedAt?.toISOString() ?? null,
    reversalOfId: row.reversalOfId,
    reversalReason: row.reversalReason,
    reversedByIds: row.reversedBy.map((entry) => entry.id),
    voucherId: row.documentLinks[0]?.accountingVoucherId ?? null,
    voucherNumber: row.documentLinks[0]?.accountingVoucher?.voucherNumber ?? null,
    lines: row.lines.map((line) => ({
      id: line.id,
      ledgerAccountCode: line.ledgerAccount.code,
      ledgerAccountName: line.ledgerAccount.name,
      description: line.description,
      debit: line.debit.toString(),
      credit: line.credit.toString(),
    })),
  }));
}
