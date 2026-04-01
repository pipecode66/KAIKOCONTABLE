import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusPill } from "@/components/layout/status-pill";
import type { AccountingPeriodListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { PeriodTransitionButton } from "@/modules/accounting/ui/components/period-transition-button";

type AccountingPeriodsTableProps = {
  organizationSlug: string;
  rows: AccountingPeriodListItemDto[];
  canManagePeriods: boolean;
  formatDate: (value: string) => string;
};

export function AccountingPeriodsTable({
  organizationSlug,
  rows,
  canManagePeriods,
  formatDate,
}: AccountingPeriodsTableProps) {
  return (
    <BaseDataTable
      title="Periodos contables"
      description="Controla apertura operativa, cierre y bloqueo. Los periodos cerrados o bloqueados ya no reciben nuevos asientos."
      columns={[
        {
          key: "periodNumber",
          title: "Periodo",
          render: (row) => (
            <div>
              <p className="font-medium text-slate-950">
                P{String(row.periodNumber).padStart(2, "0")} / {row.fiscalYear}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(row.periodStartIso)} - {formatDate(row.periodEndIso)}
              </p>
            </div>
          ),
        },
        {
          key: "status",
          title: "Estado",
          render: (row) => <StatusPill status={row.status.toLowerCase() as "open" | "closed" | "locked"} />,
        },
        {
          key: "journalEntriesCount",
          title: "Carga",
          render: (row) => (
            <div className="text-sm text-slate-600">
              <p>{row.journalEntriesCount} asientos</p>
              <p>{row.vouchersCount} vouchers</p>
            </div>
          ),
        },
        {
          key: "closedAtIso",
          title: "Trazabilidad",
          render: (row) => (
            <div className="max-w-xs text-xs leading-5 text-slate-500">
              {row.closedAtIso ? <p>Cerrado: {formatDate(row.closedAtIso)} · {row.closedByName ?? "Sistema"}</p> : null}
              {row.lockedAtIso ? <p>Bloqueado: {formatDate(row.lockedAtIso)} · {row.lockedByName ?? "Sistema"}</p> : null}
              {row.reopenedAtIso ? <p>Reabierto: {formatDate(row.reopenedAtIso)} · {row.reopenedByName ?? "Sistema"}</p> : null}
              {!row.closedAtIso && !row.lockedAtIso && !row.reopenedAtIso ? (
                <span>Sin transiciones registradas.</span>
              ) : null}
            </div>
          ),
        },
        {
          key: "id",
          title: "Acciones",
          className: "w-[220px]",
          render: (row) =>
            canManagePeriods ? (
              <div className="flex flex-wrap gap-2">
                {row.status === "OPEN" ? (
                  <>
                    <PeriodTransitionButton
                      organizationSlug={organizationSlug}
                      periodId={row.id}
                      action="close"
                    />
                    <PeriodTransitionButton
                      organizationSlug={organizationSlug}
                      periodId={row.id}
                      action="lock"
                    />
                  </>
                ) : (
                  <PeriodTransitionButton
                    organizationSlug={organizationSlug}
                    periodId={row.id}
                    action="reopen"
                  />
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500">Solo lectura</span>
            ),
        },
      ]}
      rows={rows}
      emptyState={
        <EmptyState
          title="Sin periodos configurados"
          description="Crea o siembra periodos antes de postear vouchers o asientos."
        />
      }
    />
  );
}
