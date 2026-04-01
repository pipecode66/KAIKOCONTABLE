import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusPill } from "@/components/layout/status-pill";
import type { JournalEntryListItemDto } from "@/modules/accounting/dto/accounting-core.dto";
import { reverseJournalEntryAction } from "@/modules/accounting/application/commands/accounting-core.commands";
import { ReasonActionDialog } from "@/modules/accounting/ui/components/reason-action-dialog";

type JournalEntriesTableProps = {
  organizationSlug: string;
  rows: JournalEntryListItemDto[];
  canManageAccounting: boolean;
  formatDate: (value: string) => string;
  formatMoney: (value: string) => string;
};

export function JournalEntriesTable({
  organizationSlug,
  rows,
  canManageAccounting,
  formatDate,
  formatMoney,
}: JournalEntriesTableProps) {
  return (
    <BaseDataTable
      title="Journal entries"
      description="Modo lectura del mayor de posteo. Los asientos publicados son inmutables y solo admiten correccion por reversion."
      columns={[
        {
          key: "entryNumber",
          title: "Asiento",
          render: (row) => (
            <div id={row.id}>
              <p className="font-medium text-slate-950">{row.entryNumber}</p>
              <p className="text-xs text-slate-500">
                {row.entryType.replaceAll("_", " ")} · {formatDate(row.entryDateIso)}
              </p>
            </div>
          ),
        },
        {
          key: "description",
          title: "Descripcion",
          render: (row) => (
            <div className="max-w-sm">
              <p className="font-medium text-slate-950">{row.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                Origen: {row.sourceType.replaceAll("_", " ")}
                {row.voucherNumber ? ` · Voucher ${row.voucherNumber}` : ""}
              </p>
            </div>
          ),
        },
        {
          key: "totalDebit",
          title: "Totales",
          render: (row) => (
            <div className="text-sm text-slate-600">
              <p>Debito: {formatMoney(row.totalDebit)}</p>
              <p>Credito: {formatMoney(row.totalCredit)}</p>
            </div>
          ),
        },
        {
          key: "postedAtIso",
          title: "Estado",
          render: (row) =>
            row.reversalOfId ? (
              <StatusPill status="voided" />
            ) : row.reversedByIds.length > 0 ? (
              <StatusPill status="closed" />
            ) : (
              <StatusPill status="posted" />
            ),
        },
        {
          key: "lines",
          title: "Lineas",
          render: (row) => (
            <div className="max-w-sm space-y-1 text-xs text-slate-500">
              {row.lines.slice(0, 3).map((line) => (
                <p key={line.id}>
                  {line.ledgerAccountCode} · D {formatMoney(line.debit)} / C {formatMoney(line.credit)}
                </p>
              ))}
              {row.lines.length > 3 ? <p>+ {row.lines.length - 3} lineas mas</p> : null}
            </div>
          ),
        },
        {
          key: "id",
          title: "Acciones",
          className: "w-[220px]",
          render: (row) =>
            canManageAccounting && row.reversedByIds.length === 0 && !row.reversalOfId ? (
              <ReasonActionDialog
                kind="reverse"
                title="Revertir asiento publicado"
                description="Se creara un asiento inverso en el periodo abierto actual y quedara enlazado al original."
                triggerLabel="Revertir"
                resourceId={row.id}
                onSubmit={(payload) => reverseJournalEntryAction(organizationSlug, payload)}
              />
            ) : (
              <span className="text-xs text-slate-500">
                {row.reversedByIds.length > 0 || row.reversalOfId ? "Sin accion" : "Solo lectura"}
              </span>
            ),
        },
      ]}
      rows={rows}
      emptyState={
        <EmptyState
          title="Sin asientos publicados"
          description="El journal se llenara cuando postees vouchers o documentos operativos."
        />
      }
    />
  );
}
