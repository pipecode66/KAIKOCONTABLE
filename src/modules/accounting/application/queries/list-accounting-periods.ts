import type { AccountingPeriodListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { getAccountingPeriodLabel } from "@/modules/accounting/domain/services/accounting-period.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

export async function listAccountingPeriods(organizationId: string): Promise<AccountingPeriodListItemDto[]> {
  const rows = await accountingCoreRepository.listPeriods(organizationId);

  return rows.map((row) => ({
    id: row.id,
    fiscalYear: row.fiscalYear,
    periodNumber: row.periodNumber,
    periodStartIso: row.periodStart.toISOString(),
    periodEndIso: row.periodEnd.toISOString(),
    status: row.status,
    journalEntriesCount: row._count.journalEntries,
    vouchersCount: row._count.accountingVouchers,
    closedAtIso: row.closedAt?.toISOString() ?? null,
    closedByName: row.closedBy?.name ?? row.closedBy?.email ?? null,
    lockedAtIso: row.lockedAt?.toISOString() ?? null,
    lockedByName: row.lockedBy?.name ?? row.lockedBy?.email ?? null,
    reopenedAtIso: row.reopenedAt?.toISOString() ?? null,
    reopenedByName: row.reopenedBy?.name ?? row.reopenedBy?.email ?? null,
  }));
}

export { getAccountingPeriodLabel };
