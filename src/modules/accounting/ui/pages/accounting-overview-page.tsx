import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ledgerAccountStatusOptions,
  ledgerAccountTypeOptions,
  type LedgerAccountCatalogDto,
  type LedgerAccountFilterStatus,
  type LedgerAccountParentOptionDto,
  type LedgerAccountTypeValue,
} from "@/modules/accounting/dto/ledger-account.dto";
import { LedgerAccountFormDialog } from "@/modules/accounting/ui/forms/ledger-account-form-dialog";
import { LedgerAccountsTable } from "@/modules/accounting/ui/tables/ledger-accounts-table";
import { AccountingSubnav } from "@/modules/accounting/ui/components/accounting-subnav";

type AccountingOverviewPageProps = {
  organizationSlug: string;
  catalog: LedgerAccountCatalogDto;
  parentOptions: LedgerAccountParentOptionDto[];
  canManage: boolean;
};

const summaryCards: Array<{
  key: keyof LedgerAccountCatalogDto["summary"];
  title: string;
  description: string;
}> = [
  {
    key: "totalActive",
    title: "Cuentas activas",
    description: "Catalogo disponible para operacion y nuevas reglas.",
  },
  {
    key: "totalPosting",
    title: "Cuentas de posteo",
    description: "Pueden recibir movimientos contables o documentos.",
  },
  {
    key: "totalManual",
    title: "Manual habilitado",
    description: "Aceptan ajustes manuales dentro del motor contable.",
  },
  {
    key: "totalArchived",
    title: "Archivadas",
    description: "Quedan fuera de nuevas operaciones, pero conservan trazabilidad.",
  },
];

function FilterSelect(props: {
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={props.name}
      defaultValue={props.defaultValue}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function AccountingOverviewPage({
  organizationSlug,
  catalog,
  parentOptions,
  canManage,
}: AccountingOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contabilidad"
        title="Plan de cuentas operativo"
        description="Catalogo contable real por organizacion: jerarquia, permisos backend y archivo logico con auditoria. Desde aqui alimentas vouchers, journal y reglas de posteo."
        actions={
          <div className="flex flex-wrap gap-3">
            <AccountingSubnav
              organizationSlug={organizationSlug}
              activePath={`/${organizationSlug}/accounting/ledger-accounts`}
            />
            {canManage ? (
              <LedgerAccountFormDialog
                organizationSlug={organizationSlug}
                parentOptions={parentOptions}
              />
            ) : null}
          </div>
        }
      />

      {!canManage ? (
        <Card className="rounded-[28px] border-emerald-950/5 bg-white/90">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
            <p>
              Este modulo requiere permiso de catalogos o gestion contable. La seguridad sigue
              validandose tambien en el backend para cada accion.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/${organizationSlug}/dashboard`}>Volver al dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.key} className="rounded-[28px] border-emerald-950/5 bg-white/90">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-4xl font-semibold text-slate-950">
                    {catalog.summary[card.key]}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-[28px] border-emerald-950/5 bg-white/90">
            <CardHeader className="gap-4 border-b border-emerald-950/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-xl">Catalogo de cuentas</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Filtra por codigo, nombre o descripcion. Las cuentas archivadas siguen
                    consultables para soporte y trazabilidad.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Multiempresa por organizationId
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_180px_auto_auto]">
                <input
                  type="text"
                  name="q"
                  defaultValue={catalog.filters.q}
                  placeholder="Buscar por codigo, nombre o descripcion"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                />

                <FilterSelect
                  name="type"
                  defaultValue={catalog.filters.type}
                  options={[
                    { value: "ALL", label: "Todos los tipos" },
                    ...ledgerAccountTypeOptions,
                  ] as Array<{ value: "ALL" | LedgerAccountTypeValue; label: string }>}
                />

                <FilterSelect
                  name="status"
                  defaultValue={catalog.filters.status}
                  options={ledgerAccountStatusOptions as Array<{
                    value: LedgerAccountFilterStatus;
                    label: string;
                  }>}
                />

                <Button type="submit" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                  Aplicar filtros
                </Button>

                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/${organizationSlug}/accounting/ledger-accounts`}>Limpiar</Link>
                </Button>
              </form>

              <LedgerAccountsTable
                organizationSlug={organizationSlug}
                rows={catalog.rows}
                parentOptions={parentOptions}
                canManage={canManage}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
