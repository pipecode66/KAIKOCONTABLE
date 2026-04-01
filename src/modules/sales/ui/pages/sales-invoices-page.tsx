import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { DocumentVoidDialog } from "@/components/form/document-void-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type {
  SalesInvoiceEditorDto,
  SalesInvoiceFormDependenciesDto,
  SalesInvoiceListItemDto,
} from "@/modules/sales/dto/sales.dto";
import { SalesSubnav } from "@/modules/sales/ui/components/sales-subnav";
import { PostSalesInvoiceButton } from "@/modules/sales/ui/components/post-sales-invoice-button";
import { SalesInvoiceFormDialog } from "@/modules/sales/ui/forms/sales-invoice-form-dialog";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { Button } from "@/components/ui/button";

type SalesInvoicesPageProps = {
  organizationSlug: string;
  organizationName: string;
  locale: string;
  currencyCode: string;
  filters: DocumentListFilters;
  pagination: CatalogPagination;
  rows: SalesInvoiceListItemDto[];
  editors: Record<string, SalesInvoiceEditorDto>;
  dependencies: SalesInvoiceFormDependenciesDto;
  canManage: boolean;
  onVoid: (payload: { invoiceId: string; reason: string; idempotencyKey: string }) => Promise<{
    success: boolean;
    message: string;
  }>;
};

export function SalesInvoicesPage({
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
}: SalesInvoicesPageProps) {
  const basePath = `/${organizationSlug}/sales/invoices`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventas"
        title="Facturas de venta"
        description="CRUD real con filtros, estados draft/post/void y publicacion contable atomica."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <SalesSubnav organizationSlug={organizationSlug} activeKey="invoices" />
            {canManage ? (
              <SalesInvoiceFormDialog
                organizationSlug={organizationSlug}
                dependencies={dependencies}
              />
            ) : null}
          </div>
        }
      />

      <BaseDataTable
        title="Facturas"
        description="Las facturas toman numero oficial al publicarse y quedan inmuebles salvo anulacion con reversion."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar por numero o cliente..."
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
                <p className="text-xs text-slate-500">{row.customerName}</p>
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
                      <SalesInvoiceFormDialog
                        organizationSlug={organizationSlug}
                        dependencies={dependencies}
                        invoice={editors[row.id]}
                      />
                      <PostSalesInvoiceButton organizationSlug={organizationSlug} invoiceId={row.id} />
                    </>
                  ) : null}
                  {row.status === "POSTED" ? (
                    <DocumentVoidDialog
                      title="Anular factura"
                      description="La anulacion genera un asiento de reversion y deja la factura en VOIDED."
                      resourceId={row.id}
                      idempotencyKey={`sales-invoice-void:${row.id}`}
                      onSubmit={(payload) =>
                        onVoid({
                          invoiceId: row.id,
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
            title="Sin facturas registradas"
            description="Empieza creando una factura en borrador y publícala cuando esté validada."
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
