import { PageHeader } from "@/components/layout/page-header";
import type { JournalEntryListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { AccountingSubnav } from "@/modules/accounting/ui/components/accounting-subnav";
import { JournalEntriesTable } from "@/modules/accounting/ui/tables/journal-entries-table";

type JournalEntriesPageProps = {
  organizationSlug: string;
  organizationName: string;
  canManageAccounting: boolean;
  rows: JournalEntryListItemDto[];
  formatDate: (value: string) => string;
  formatMoney: (value: string) => string;
};

export function JournalEntriesPage({
  organizationSlug,
  organizationName,
  canManageAccounting,
  rows,
  formatDate,
  formatMoney,
}: JournalEntriesPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Journal"
        title="Mayor en modo lectura"
        description="Consulta los asientos ya publicados, su vínculo con vouchers y la trazabilidad de reversiones sin exponer edición directa."
        badge={organizationName}
        actions={
          <AccountingSubnav
            organizationSlug={organizationSlug}
            activePath={`/${organizationSlug}/accounting/journal`}
          />
        }
      />

      <JournalEntriesTable
        organizationSlug={organizationSlug}
        rows={rows}
        canManageAccounting={canManageAccounting}
        formatDate={formatDate}
        formatMoney={formatMoney}
      />
    </div>
  );
}
