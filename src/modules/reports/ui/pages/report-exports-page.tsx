import Link from "next/link";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import type { ReportExportJobDto } from "@/modules/reports/dto/reports.dto";
import type { ExportsFilters } from "@/modules/reports/validators/reports.validator";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";

type ReportExportsPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: ExportsFilters;
  pagination: CatalogPagination;
  rows: ReportExportJobDto[];
  formatDate: (value: string) => string;
};

export function ReportExportsPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  rows,
  formatDate,
}: ReportExportsPageProps) {
  const basePath = `/${organizationSlug}/reports/exports`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Exportaciones pesadas"
        description="Historial de jobs de exportacion disparados desde el modulo de reportes."
        badge={organizationName}
        actions={<ReportsSubnav organizationSlug={organizationSlug} activeKey="exports" />}
      />

      <BaseDataTable
        title="Jobs de exportacion"
        description="Estado del procesamiento en background y acceso a descargas terminadas."
        rows={rows}
        columns={[
          { key: "fileName", title: "Archivo", render: (row) => row.fileName ?? "Pendiente de generacion" },
          {
            key: "status",
            title: "Estado",
            render: (row) => (
              <StatusPill
                status={row.status.toLowerCase() as Parameters<typeof StatusPill>[0]["status"]}
              />
            ),
          },
          { key: "createdAtIso", title: "Solicitado", render: (row) => formatDate(row.createdAtIso) },
          { key: "updatedAtIso", title: "Actualizado", render: (row) => formatDate(row.updatedAtIso) },
          {
            key: "downloadUrl",
            title: "Acciones",
            render: (row) =>
              row.downloadUrl ? (
                <Link href={row.downloadUrl} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                  Descargar
                </Link>
              ) : (
                <span className="text-xs text-slate-500">{row.lastError ?? "Aun procesando"}</span>
              ),
          },
        ]}
        emptyState={<EmptyState title="Sin exportaciones" description="Solicita un export desde cualquiera de los reportes para verlo aqui." />}
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
