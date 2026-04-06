import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type { ReconciliationListItemDto } from "@/modules/treasury/dto/treasury.dto";
import type { ReconciliationFilterValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { CompleteReconciliationDialog } from "@/modules/treasury/ui/components/complete-reconciliation-dialog";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";
import { ReconciliationFormDialog } from "@/modules/treasury/ui/forms/reconciliation-form-dialog";

type ReconciliationsPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: ReconciliationFilterValues;
  pagination: CatalogPagination;
  rows: ReconciliationListItemDto[];
  bankAccounts: Array<{ value: string; label: string }>;
  canManage: boolean;
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function ReconciliationsPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  rows,
  bankAccounts,
  canManage,
  formatMoney,
  formatDate,
}: ReconciliationsPageProps) {
  const basePath = `/${organizationSlug}/treasury/reconciliations`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Conciliacion asistida"
        description="Compara extractos con pagos y traslados publicados, sugiere matches y deja trazabilidad visible."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <TreasurySubnav organizationSlug={organizationSlug} activeKey="reconciliations" />
            {canManage ? <ReconciliationFormDialog organizationSlug={organizationSlug} bankAccounts={bankAccounts} /> : null}
          </div>
        }
      />

      <BaseDataTable
        title="Ventanas de conciliacion"
        description="Cada conciliacion muestra saldos libro vs extracto y las sugerencias todavia pendientes."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <select
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button type="submit" className="rounded-full bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              Filtrar
            </button>
          </form>
        }
        columns={[
          {
            key: "bankAccountName",
            title: "Cuenta",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.bankAccountName}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(row.periodStartIso)} - {formatDate(row.periodEndIso)}
                </p>
              </div>
            ),
          },
          {
            key: "statementBalance",
            title: "Saldos",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p>Extracto {formatMoney(row.statementBalance)}</p>
                <p className="text-xs text-slate-500">Libro {formatMoney(row.bookBalance)}</p>
              </div>
            ),
          },
          {
            key: "suggestions",
            title: "Sugerencias",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p>{row.suggestions.length} sugeridas</p>
                <p className="text-xs text-slate-500">{row.lineCount} cruces ya aplicados</p>
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
                    : row.status === "IN_PROGRESS"
                      ? "active"
                      : "draft"
                }
              />
            ),
          },
          {
            key: "id",
            title: "Acciones",
            className: "w-[260px]",
            render: (row) =>
              canManage && row.status !== "COMPLETED" && row.suggestions.length > 0 ? (
                <CompleteReconciliationDialog
                  organizationSlug={organizationSlug}
                  reconciliationId={row.id}
                  suggestions={row.suggestions}
                />
              ) : (
                <span className="text-xs text-slate-500">
                  {row.status === "COMPLETED" ? "Conciliada" : "Sin sugerencias"}
                </span>
              ),
          },
        ]}
        rows={rows}
        emptyState={
          <EmptyState
            title="Sin conciliaciones"
            description="Crea una ventana de conciliacion y deja que el sistema proponga cruces."
            action={canManage ? <ReconciliationFormDialog organizationSlug={organizationSlug} bankAccounts={bankAccounts} /> : undefined}
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
