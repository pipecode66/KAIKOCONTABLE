import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import type { AgingReportDto } from "@/modules/reports/dto/reports.dto";
import type { AgingReportFilters } from "@/modules/reports/validators/reports.validator";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";

type AgingPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: AgingReportFilters;
  pagination: CatalogPagination;
  report: AgingReportDto;
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function AgingPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  report,
  formatMoney,
  formatDate,
}: AgingPageProps) {
  const basePath = `/${organizationSlug}/reports/aging`;
  const exportKey = report.kind === "RECEIVABLE" ? "aging-receivables" : "aging-payables";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Aging"
        description="Bucketizacion de cartera y obligaciones por edad para priorizar recaudo o pago."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="aging" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey={exportKey} defaultAsOf={filters.asOf} />
          </div>
        }
      />

      <form className="flex flex-wrap items-end gap-3 rounded-[28px] border border-emerald-950/5 bg-white/95 p-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Fecha de corte</span>
          <input type="date" name="asOf" defaultValue={filters.asOf} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Vista</span>
          <select name="kind" defaultValue={filters.kind} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500">
            <option value="RECEIVABLE">CxC</option>
            <option value="PAYABLE">CxP</option>
          </select>
        </label>
        <input type="text" name="q" defaultValue={filters.q} placeholder="Buscar tercero o documento..." className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        <button type="submit" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Actualizar
        </button>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {report.buckets.map((bucket) => (
          <KpiCard key={bucket.key} title={bucket.label} value={formatMoney(bucket.total)} caption="Saldo agregado del bucket." tone={bucket.key === "current" ? "emerald" : "ivory"} />
        ))}
      </section>

      <BaseDataTable
        title={report.kind === "RECEIVABLE" ? "Detalle de cartera" : "Detalle de obligaciones"}
        description="Detalle de documentos por edad."
        rows={report.rows}
        columns={[
          { key: "documentNumber", title: "Documento" },
          { key: "thirdPartyName", title: "Tercero" },
          { key: "dueDateIso", title: "Vencimiento", render: (row) => (row.dueDateIso ? formatDate(row.dueDateIso) : "-") },
          { key: "balanceDue", title: "Saldo", render: (row) => formatMoney(row.balanceDue) },
          { key: "ageDays", title: "Edad", render: (row) => `${row.ageDays} dias` },
        ]}
        emptyState={<EmptyState title="Sin documentos para aging" description="No hay saldos pendientes para la vista elegida." />}
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
