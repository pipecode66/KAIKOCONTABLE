import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { DocumentVoidDialog } from "@/components/form/document-void-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type {
  TransferEditorDto,
  TransferFormDependenciesDto,
  TransferListItemDto,
} from "@/modules/treasury/dto/treasury.dto";
import type { TreasuryDocumentFilterValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { PostTransferButton } from "@/modules/treasury/ui/components/post-transfer-button";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";
import { TransferFormDialog } from "@/modules/treasury/ui/forms/transfer-form-dialog";

type TransfersPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: TreasuryDocumentFilterValues;
  pagination: CatalogPagination;
  rows: TransferListItemDto[];
  editors: Record<string, TransferEditorDto>;
  dependencies: TransferFormDependenciesDto;
  canManage: boolean;
  formatMoney: (value: string) => string;
  onVoid: (payload: { id: string; reason: string; idempotencyKey: string }) => Promise<{
    success: boolean;
    message: string;
  }>;
};

export function TransfersPage({
  organizationSlug,
  organizationName,
  filters,
  pagination,
  rows,
  editors,
  dependencies,
  canManage,
  formatMoney,
  onVoid,
}: TransfersPageProps) {
  const basePath = `/${organizationSlug}/treasury/transfers`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Traslados internos"
        description="Mueve liquidez entre bancos y caja con estados draft/post/void y asiento contable automatico."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <TreasurySubnav organizationSlug={organizationSlug} activeKey="transfers" />
            {canManage ? <TransferFormDialog organizationSlug={organizationSlug} dependencies={dependencies} /> : null}
          </div>
        }
      />

      <BaseDataTable
        title="Traslados"
        description="Los traslados quedan numerados al publicarse y dejan rastro completo entre origen y destino."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar por referencia, nota o cuenta..."
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
            <select
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="VOIDED">Voided</option>
            </select>
            <Button type="submit" size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              Filtrar
            </Button>
          </form>
        }
        columns={[
          {
            key: "reference",
            title: "Traslado",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.reference ?? "Sin referencia"}</p>
                <p className="text-xs text-slate-500">{row.sourceLabel} → {row.destinationLabel}</p>
              </div>
            ),
          },
          {
            key: "transferDateIso",
            title: "Fecha",
            render: (row) => row.transferDateIso.slice(0, 10),
          },
          {
            key: "amount",
            title: "Monto",
            render: (row) => formatMoney(row.amount),
          },
          {
            key: "status",
            title: "Estado",
            render: (row) => <StatusPill status={row.status.toLowerCase() as "draft" | "posted" | "voided"} />,
          },
          {
            key: "journalEntryNumber",
            title: "Journal",
            render: (row) => row.journalEntryNumber ?? "Pendiente de posteo",
          },
          {
            key: "id",
            title: "Acciones",
            className: "w-[320px]",
            render: (row) =>
              canManage ? (
                <div className="flex flex-wrap gap-2">
                  {row.status === "DRAFT" ? (
                    <>
                      <TransferFormDialog
                        organizationSlug={organizationSlug}
                        dependencies={dependencies}
                        transfer={editors[row.id]}
                      />
                      <PostTransferButton organizationSlug={organizationSlug} transferId={row.id} />
                    </>
                  ) : null}
                  {row.status === "POSTED" ? (
                    <DocumentVoidDialog
                      title="Anular traslado"
                      description="La anulacion genera la reversion contable del movimiento entre tesorerias."
                      resourceId={row.id}
                      idempotencyKey={`transfer-void:${row.id}`}
                      onSubmit={(payload) =>
                        onVoid({
                          id: row.id,
                          reason: payload.reason,
                          idempotencyKey: payload.idempotencyKey,
                        })
                      }
                    />
                  ) : null}
                  {row.status === "VOIDED" ? (
                    <span className="text-xs text-slate-500">{row.voidReason ?? "Anulado"}</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-slate-500">Solo lectura</span>
              ),
          },
        ]}
        rows={rows}
        emptyState={
          <EmptyState
            title="Sin traslados registrados"
            description="Crea un traslado en borrador para mover liquidez entre bancos y caja."
            action={canManage ? <TransferFormDialog organizationSlug={organizationSlug} dependencies={dependencies} /> : undefined}
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
