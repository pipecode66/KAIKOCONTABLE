import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { DocumentVoidDialog } from "@/components/form/document-void-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";
import type {
  PaymentEditorDto,
  PaymentFormDependenciesDto,
  PaymentListItemDto,
} from "@/modules/treasury/dto/treasury.dto";
import type { TreasuryDocumentFilterValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { PostPaymentButton } from "@/modules/treasury/ui/components/post-payment-button";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";
import { PaymentFormDialog } from "@/modules/treasury/ui/forms/payment-form-dialog";

type PaymentsPageProps = {
  organizationSlug: string;
  organizationName: string;
  filters: TreasuryDocumentFilterValues;
  pagination: CatalogPagination;
  rows: PaymentListItemDto[];
  editors: Record<string, PaymentEditorDto>;
  dependencies: PaymentFormDependenciesDto;
  canManage: boolean;
  formatMoney: (value: string) => string;
  onVoid: (payload: { id: string; reason: string; idempotencyKey: string }) => Promise<{
    success: boolean;
    message: string;
  }>;
};

export function PaymentsPage({
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
}: PaymentsPageProps) {
  const basePath = `/${organizationSlug}/treasury/payments`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Pagos y recaudos"
        description="Cobros y desembolsos con estados draft/post/void, aplicacion a cartera u obligaciones y posteo contable atomico."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <TreasurySubnav organizationSlug={organizationSlug} activeKey="payments" />
            {canManage ? (
              <PaymentFormDialog organizationSlug={organizationSlug} dependencies={dependencies} />
            ) : null}
          </div>
        }
      />

      <BaseDataTable
        title="Pagos"
        description="Cada pago se publica una sola vez, toma referencia oficial y actualiza saldos abiertos."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar por referencia o tercero..."
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
            <select
              name="direction"
              defaultValue={filters.direction}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todas las direcciones</option>
              <option value="RECEIVED">Recibidos</option>
              <option value="SENT">Enviados</option>
            </select>
            <Button type="submit" size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              Filtrar
            </Button>
          </form>
        }
        columns={[
          {
            key: "reference",
            title: "Pago",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.reference ?? "Sin referencia"}</p>
                <p className="text-xs text-slate-500">{row.partyName ?? "Sin tercero"}</p>
              </div>
            ),
          },
          {
            key: "direction",
            title: "Direccion",
            render: (row) => (
              <span className="text-sm text-slate-700">{row.direction === "RECEIVED" ? "Recibido" : "Enviado"}</span>
            ),
          },
          {
            key: "treasuryAccountName",
            title: "Cuenta",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.treasuryAccountName}</p>
                <p className="text-xs text-slate-500">{row.treasuryAccountType === "BANK" ? "Banco" : "Caja"}</p>
              </div>
            ),
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
            title: "Trazabilidad",
            render: (row) => (
              <div className="text-sm text-slate-700">
                <p>{row.journalEntryNumber ?? "Pendiente de posteo"}</p>
                <p className="text-xs text-slate-500">{row.allocationCount} aplicaciones</p>
              </div>
            ),
          },
          {
            key: "id",
            title: "Acciones",
            className: "w-[340px]",
            render: (row) =>
              canManage ? (
                <div className="flex flex-wrap gap-2">
                  {row.status === "DRAFT" ? (
                    <>
                      <PaymentFormDialog
                        organizationSlug={organizationSlug}
                        dependencies={dependencies}
                        payment={editors[row.id]}
                      />
                      <PostPaymentButton organizationSlug={organizationSlug} paymentId={row.id} />
                    </>
                  ) : null}
                  {row.status === "POSTED" ? (
                    <DocumentVoidDialog
                      title="Anular pago"
                      description="La anulacion genera reversion contable y revierte las aplicaciones contra documentos abiertos."
                      resourceId={row.id}
                      idempotencyKey={`payment-void:${row.id}`}
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
            title="Sin pagos registrados"
            description="Crea un borrador de pago para empezar a controlar recaudos y salidas de tesoreria."
            action={canManage ? <PaymentFormDialog organizationSlug={organizationSlug} dependencies={dependencies} /> : undefined}
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
