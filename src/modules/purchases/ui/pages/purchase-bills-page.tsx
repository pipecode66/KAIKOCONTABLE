import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { DocumentVoidDialog } from "@/components/form/document-void-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type {
  PurchaseBillEditorDto,
  PurchaseBillFormDependenciesDto,
  PurchaseBillListItemDto,
} from "@/modules/purchases/dto/purchase-bill.dto";
import { PostPurchaseBillButton } from "@/modules/purchases/ui/components/post-purchase-bill-button";
import { PurchasesSubnav } from "@/modules/purchases/ui/components/purchases-subnav";
import { PurchaseBillFormDialog } from "@/modules/purchases/ui/forms/purchase-bill-form-dialog";

type PurchaseBillsPageProps = {
  organizationSlug: string;
  organizationName: string;
  locale: string;
  currencyCode: string;
  filters: DocumentListFilters;
  pagination: CatalogPagination;
  rows: PurchaseBillListItemDto[];
  editors: Record<string, PurchaseBillEditorDto>;
  dependencies: PurchaseBillFormDependenciesDto;
  canManage: boolean;
  onVoid: (payload: { billId: string; reason: string; idempotencyKey: string }) => Promise<{
    success: boolean;
    message: string;
  }>;
};

export function PurchaseBillsPage({
  organizationSlug,
  organizationName,
  locale,
  currencyCode,
  filters,
  pagination,
  rows,
  editors,
  dependencies,
  canManage,
  onVoid,
}: PurchaseBillsPageProps) {
  const basePath = `/${organizationSlug}/purchases/bills`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compras"
        title="Facturas de compra"
        description="CRUD real con filtros, estados draft/post/void y publicacion contable atomica para cuentas por pagar."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <PurchasesSubnav organizationSlug={organizationSlug} activeKey="bills" />
            {canManage ? (
              <PurchaseBillFormDialog
                organizationSlug={organizationSlug}
                dependencies={dependencies}
              />
            ) : null}
          </div>
        }
      />

      <BaseDataTable
        title="Facturas proveedor"
        description="Las facturas toman numero oficial al publicarse y quedan inmutables salvo anulacion con reversion."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar por numero o proveedor..."
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
            key: "internalNumber",
            title: "Documento",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.documentNumber ?? row.internalNumber}</p>
                <p className="text-xs text-slate-500">{row.supplierName}</p>
              </div>
            ),
          },
          {
            key: "issueDateIso",
            title: "Fechas",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p>{row.issueDateIso.slice(0, 10)}</p>
                <p className="text-xs text-slate-500">Vence {row.dueDateIso?.slice(0, 10) ?? "sin fecha"}</p>
              </div>
            ),
          },
          {
            key: "total",
            title: "Totales",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p className="font-medium text-slate-950">
                  {formatMoneyForOrganization(Number(row.total), { locale, currencyCode })}
                </p>
                <p className="text-xs text-slate-500">
                  Saldo {formatMoneyForOrganization(Number(row.balanceDue), { locale, currencyCode })}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            title: "Estado",
            render: (row) => <StatusPill status={row.status.toLowerCase() as "draft" | "posted" | "voided"} />,
          },
          {
            key: "journalEntryNumber",
            title: "Trazabilidad",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p>{row.journalEntryNumber ?? "Pendiente de posteo"}</p>
                <p className="text-xs text-slate-500">{row.lineCount} lineas</p>
              </div>
            ),
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
                      <PurchaseBillFormDialog
                        organizationSlug={organizationSlug}
                        dependencies={dependencies}
                        bill={editors[row.id]}
                      />
                      <PostPurchaseBillButton organizationSlug={organizationSlug} billId={row.id} />
                    </>
                  ) : null}
                  {row.status === "POSTED" ? (
                    <DocumentVoidDialog
                      title="Anular factura de compra"
                      description="La anulacion genera un asiento de reversion y deja la factura en VOIDED."
                      resourceId={row.id}
                      idempotencyKey={`purchase-bill-void:${row.id}`}
                      onSubmit={(payload) =>
                        onVoid({
                          billId: row.id,
                          reason: payload.reason,
                          idempotencyKey: payload.idempotencyKey,
                        })
                      }
                    />
                  ) : null}
                  {row.status === "VOIDED" ? (
                    <span className="text-xs text-slate-500">{row.voidReason ?? "Anulada"}</span>
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
            title="Sin facturas de compra registradas"
            description="Empieza creando una factura proveedor en borrador y publicala cuando la validacion tributaria y contable este lista."
            action={
              canManage ? (
                <PurchaseBillFormDialog
                  organizationSlug={organizationSlug}
                  dependencies={dependencies}
                />
              ) : undefined
            }
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
