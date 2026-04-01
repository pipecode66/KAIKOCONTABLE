import { PageHeader } from "@/components/layout/page-header";
import type { ManualVoucherListItemDto, VoucherFormDependenciesDto } from "@/modules/accounting/dto/accounting-core.dto";
import { AccountingSubnav } from "@/modules/accounting/ui/components/accounting-subnav";
import { ManualVoucherFormDialog } from "@/modules/accounting/ui/forms/manual-voucher-form-dialog";
import { AccountingVouchersTable } from "@/modules/accounting/ui/tables/accounting-vouchers-table";

type AccountingVouchersPageProps = {
  organizationSlug: string;
  organizationName: string;
  canManageAccounting: boolean;
  canPostManualVoucher: boolean;
  dependencies: VoucherFormDependenciesDto;
  rows: ManualVoucherListItemDto[];
  formatDate: (value: string) => string;
  formatMoney: (value: string) => string;
};

export function AccountingVouchersPage({
  organizationSlug,
  organizationName,
  canManageAccounting,
  canPostManualVoucher,
  dependencies,
  rows,
  formatDate,
  formatMoney,
}: AccountingVouchersPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manual vouchers"
        title="Ajustes y saldos iniciales"
        description="Crea vouchers manuales balanceados, mantenlos en draft mientras los revisas y publícalos cuando quieras asignar numeración oficial y journal entry."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <AccountingSubnav
              organizationSlug={organizationSlug}
              activePath={`/${organizationSlug}/accounting/vouchers`}
            />
            {canManageAccounting ? (
              <ManualVoucherFormDialog
                organizationSlug={organizationSlug}
                dependencies={dependencies}
              />
            ) : null}
          </div>
        }
      />

      <AccountingVouchersTable
        organizationSlug={organizationSlug}
        rows={rows}
        dependencies={dependencies}
        canManageAccounting={canManageAccounting}
        canPostManualVoucher={canPostManualVoucher}
        formatDate={formatDate}
        formatMoney={formatMoney}
      />
    </div>
  );
}
