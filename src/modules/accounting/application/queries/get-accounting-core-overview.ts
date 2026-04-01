import type { AccountingCoreOverviewDto } from "@/modules/accounting/dto/accounting-core.dto";
import { listAccountingPeriods } from "@/modules/accounting/application/queries/list-accounting-periods";
import { listAccountingVouchers } from "@/modules/accounting/application/queries/list-accounting-vouchers";
import { listJournalEntries } from "@/modules/accounting/application/queries/list-journal-entries";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

export async function getAccountingCoreOverview(input: {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  canManageAccounting: boolean;
  canPostManualVoucher: boolean;
  canManagePeriods: boolean;
}): Promise<AccountingCoreOverviewDto> {
  const [metrics, periods, vouchers, journalEntries] = await Promise.all([
    accountingCoreRepository.countCoreMetrics(input.organizationId),
    listAccountingPeriods(input.organizationId),
    listAccountingVouchers(input.organizationId),
    listJournalEntries(input.organizationId),
  ]);

  return {
    organizationSlug: input.organizationSlug,
    organizationName: input.organizationName,
    canManageAccounting: input.canManageAccounting,
    canPostManualVoucher: input.canPostManualVoucher,
    canManagePeriods: input.canManagePeriods,
    metrics,
    recentPeriods: periods.slice(0, 3),
    recentVouchers: vouchers.slice(0, 4),
    recentEntries: journalEntries.slice(0, 4),
  };
}
