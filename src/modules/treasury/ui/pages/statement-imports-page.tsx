import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type {
  StatementImportDependenciesDto,
  StatementImportListItemDto,
} from "@/modules/treasury/dto/treasury.dto";
import type { StatementImportFilterValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";
import { StatementImportDialog } from "@/modules/treasury/ui/forms/statement-import-dialog";

type StatementImportsPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: StatementImportFilterValues;
  pagination: CatalogPagination;
  rows: StatementImportListItemDto[];
  dependencies: StatementImportDependenciesDto;
  canManage: boolean;
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function StatementImportsPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  rows,
  dependencies,
  canManage,
  formatMoney,
  formatDate,
}: StatementImportsPageProps) {
  const basePath = `/${organizationSlug}/treasury/imports`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Importacion de extractos"
        description="Carga CSV bancarios, procesa filas en background y deja base lista para conciliacion asistida."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <TreasurySubnav organizationSlug={organizationSlug} activeKey="imports" />
            {canManage ? <StatementImportDialog organizationSlug={organizationSlug} dependencies={dependencies} /> : null}
          </div>
        }
      />

      <BaseDataTable
        title="Extractos cargados"
        description="Cada archivo viaja por outbox y job runner hasta crear lineas bancarias en la cuenta correspondiente."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <select
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <button type="submit" className="rounded-full bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              Filtrar
            </button>
          </form>
        }
        columns={[
          {
            key: "fileName",
            title: "Archivo",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.fileName}</p>
                <p className="text-xs text-slate-500">{row.bankAccountName}</p>
              </div>
            ),
          },
          {
            key: "status",
            title: "Estado",
            render: (row) => (
              <StatusPill
                status={
                  row.status === "COMPLETED"
                    ? "posted"
                    : row.status === "PROCESSING"
                      ? "active"
                      : row.status === "FAILED"
                        ? "failed"
                        : "pending"
                }
              />
            ),
          },
          {
            key: "rowsCount",
            title: "Filas",
            render: (row) => `${row.rowsCount} movimientos`,
          },
          {
            key: "sampleLines",
            title: "Muestra",
            render: (row) =>
              row.sampleLines.length > 0 ? (
                <div className="space-y-1">
                  {row.sampleLines.slice(0, 2).map((line) => (
                    <p key={line.id} className="text-xs text-slate-500">
                      {formatDate(line.transactionDateIso)} · {line.description} · {formatMoney(line.amount)}
                    </p>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">Sin lineas cargadas</span>
              ),
          },
        ]}
        rows={rows}
        emptyState={
          <EmptyState
            title="Sin extractos importados"
            description="Sube el primer CSV para poblar movimientos bancarios y preparar la conciliacion."
            action={canManage ? <StatementImportDialog organizationSlug={organizationSlug} dependencies={dependencies} /> : undefined}
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
