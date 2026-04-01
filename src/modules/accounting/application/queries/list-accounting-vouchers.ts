import type { ManualVoucherListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

export async function listAccountingVouchers(
  organizationId: string,
): Promise<ManualVoucherListItemDto[]> {
  const rows = await accountingCoreRepository.listVouchers(organizationId);

  return rows.map((row) => ({
    id: row.id,
    voucherNumber: row.voucherNumber,
    voucherType: row.voucherType,
    description: row.description,
    entryDateIso: row.entryDate.toISOString(),
    status: row.status,
    debitTotal: row.debitTotal.toString(),
    creditTotal: row.creditTotal.toString(),
    postedAtIso: row.postedAt?.toISOString() ?? null,
    voidedAtIso: row.voidedAt?.toISOString() ?? null,
    voidReason: row.voidReason,
    version: row.version,
    periodLabel: `P${String(row.accountingPeriod.periodNumber).padStart(2, "0")} / ${row.accountingPeriod.fiscalYear}`,
    journalEntryId: row.documentLinks[0]?.journalEntryId ?? null,
    journalEntryNumber: row.documentLinks[0]?.journalEntry?.entryNumber ?? null,
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
