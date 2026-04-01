import { PageHeader } from "@/components/layout/page-header";
import type { AccountingPeriodListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { AccountingSubnav } from "@/modules/accounting/ui/components/accounting-subnav";
import { AccountingPeriodsTable } from "@/modules/accounting/ui/tables/accounting-periods-table";

type AccountingPeriodsPageProps = {
  organizationSlug: string;
  organizationName: string;
  canManagePeriods: boolean;
  rows: AccountingPeriodListItemDto[];
  formatDate: (value: string) => string;
};

export function AccountingPeriodsPage({
  organizationSlug,
  organizationName,
  canManagePeriods,
  rows,
  formatDate,
}: AccountingPeriodsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounting periods"
        title="Control de periodos"
        description="Administra cierre, bloqueo y reapertura del calendario contable con validacion backend y trazabilidad visible."
        badge={organizationName}
        actions={
          <AccountingSubnav
            organizationSlug={organizationSlug}
            activePath={`/${organizationSlug}/accounting/periods`}
          />
        }
      />

      <AccountingPeriodsTable
        organizationSlug={organizationSlug}
        rows={rows}
        canManagePeriods={canManagePeriods}
        formatDate={formatDate}
      />
    </div>
  );
}
