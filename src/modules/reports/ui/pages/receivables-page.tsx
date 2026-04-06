import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import type { OutstandingDocumentDto } from "@/modules/reports/dto/reports.dto";
import type { OpenDocumentsFilters } from "@/modules/reports/validators/reports.validator";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";

type ReceivablesPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: OpenDocumentsFilters;
  pagination: CatalogPagination;
  rows: OutstandingDocumentDto[];
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function ReceivablesPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  rows,
  formatMoney,
  formatDate,
}: ReceivablesPageProps) {
  const basePath = `/${organizationSlug}/reports/receivables`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Cuentas por cobrar"
        description="Facturas de venta abiertas, con saldo vivo y edad de cartera."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="receivables" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey="receivables" defaultAsOf={filters.asOf} />
          </div>
        }
      />

      <BaseDataTable
        title="Cartera abierta"
        description="Documentos posteados aun pendientes de recaudo."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input type="date" name="asOf" defaultValue={filters.asOf} className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
            <input type="text" name="q" defaultValue={filters.q} placeholder="Buscar documento o tercero..." className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
            <button type="submit" className="rounded-full bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              Filtrar
            </button>
          </form>
        }
        rows={rows}
        columns={[
          { key: "documentNumber", title: "Documento" },
          { key: "thirdPartyName", title: "Cliente" },
          { key: "issueDateIso", title: "Fecha", render: (row) => formatDate(row.issueDateIso) },
          { key: "dueDateIso", title: "Vencimiento", render: (row) => (row.dueDateIso ? formatDate(row.dueDateIso) : "-") },
          { key: "balanceDue", title: "Saldo", render: (row) => formatMoney(row.balanceDue) },
          { key: "ageDays", title: "Edad", render: (row) => `${row.ageDays} dias` },
        ]}
        emptyState={<EmptyState title="Sin cartera abierta" description="No hay facturas de venta pendientes para los filtros aplicados." />}
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
