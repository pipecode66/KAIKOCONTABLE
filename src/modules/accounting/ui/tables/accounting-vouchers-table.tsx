import Link from "next/link";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import type { ManualVoucherListItemDto, VoucherFormDependenciesDto } from "@/modules/accounting/dto/accounting-core.dto";
import { voidAccountingVoucherAction } from "@/modules/accounting/application/commands/accounting-core.commands";
import { PostVoucherButton } from "@/modules/accounting/ui/components/post-voucher-button";
import { ReasonActionDialog } from "@/modules/accounting/ui/components/reason-action-dialog";
import { ManualVoucherFormDialog } from "@/modules/accounting/ui/forms/manual-voucher-form-dialog";

type AccountingVouchersTableProps = {
  organizationSlug: string;
  rows: ManualVoucherListItemDto[];
  dependencies: VoucherFormDependenciesDto;
  canManageAccounting: boolean;
  canPostManualVoucher: boolean;
  formatDate: (value: string) => string;
  formatMoney: (value: string) => string;
};

export function AccountingVouchersTable({
  organizationSlug,
  rows,
  dependencies,
  canManageAccounting,
  canPostManualVoucher,
  formatDate,
  formatMoney,
}: AccountingVouchersTableProps) {
  return (
    <BaseDataTable
      title="Vouchers manuales"
      description="Los borradores siguen editables. El numero oficial y el asiento contable se asignan al momento del posteo."
      columns={[
        {
          key: "voucherNumber",
          title: "Voucher",
          render: (row) => (
            <div>
              <p className="font-medium text-slate-950">{row.voucherNumber ?? "Sin numerar"}</p>
              <p className="text-xs text-slate-500">{row.periodLabel}</p>
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
                {row.voucherType.replaceAll("_", " ")} · {formatDate(row.entryDateIso)}
              </p>
            </div>
          ),
        },
        {
          key: "debitTotal",
          title: "Total",
          render: (row) => (
            <div className="text-sm text-slate-600">
              <p>Debito: {formatMoney(row.debitTotal)}</p>
              <p>Credito: {formatMoney(row.creditTotal)}</p>
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
            <div className="max-w-xs text-xs leading-5 text-slate-500">
              {row.postedAtIso ? <p>Posteado: {formatDate(row.postedAtIso)}</p> : <p>Pendiente de posteo.</p>}
              {row.journalEntryNumber ? (
                <p>Journal: {row.journalEntryNumber}</p>
              ) : null}
              {row.voidReason ? <p>Anulado: {row.voidReason}</p> : null}
            </div>
          ),
        },
        {
          key: "id",
          title: "Acciones",
          className: "w-[320px]",
          render: (row) =>
            canManageAccounting ? (
              <div className="flex flex-wrap gap-2">
                {row.status === "DRAFT" ? (
                  <>
                    <ManualVoucherFormDialog
                      organizationSlug={organizationSlug}
                      dependencies={dependencies}
                      voucher={row}
                    />
                    {canPostManualVoucher ? <PostVoucherButton organizationSlug={organizationSlug} voucherId={row.id} /> : null}
                  </>
                ) : null}

                {row.status === "POSTED" ? (
                  <>
                    {row.journalEntryId ? (
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/${organizationSlug}/accounting/journal#${row.journalEntryId}`}>Ver journal</Link>
                      </Button>
                    ) : null}
                    <ReasonActionDialog
                      kind="void"
                      title="Anular voucher publicado"
                      description="La anulacion genera un asiento inverso y deja trazabilidad completa."
                      triggerLabel="Anular"
                      triggerVariant="outline"
                      resourceId={row.id}
                      version={row.version}
                      onSubmit={(payload) => voidAccountingVoucherAction(organizationSlug, payload)}
                    />
                  </>
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
          title="Aun no hay vouchers"
          description="Crea el primer ajuste manual o saldo inicial para alimentar el journal."
        />
      }
    />
  );
}
