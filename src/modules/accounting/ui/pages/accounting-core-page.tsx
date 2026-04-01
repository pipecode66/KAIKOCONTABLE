import Link from "next/link";
import { BookOpenText, CalendarClock, FileStack, Scale } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountingCoreOverviewDto } from "@/modules/accounting/dto/accounting-core.dto";
import { AccountingSubnav } from "@/modules/accounting/ui/components/accounting-subnav";

type AccountingCorePageProps = {
  overview: AccountingCoreOverviewDto;
  formatDate: (value: string) => string;
  formatMoney: (value: string) => string;
};

export function AccountingCorePage({
  overview,
  formatDate,
  formatMoney,
}: AccountingCorePageProps) {
  const baseHref = `/${overview.organizationSlug}/accounting`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core contable"
        title="Motor contable base"
        description="Sprint 3 deja operativo el nucleo: periodos, vouchers manuales, journal entry de lectura, numeracion al postear, reversion e inmutabilidad de asientos publicados."
        badge={overview.organizationName}
        actions={<AccountingSubnav organizationSlug={overview.organizationSlug} activePath={baseHref} />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Periodos abiertos"
          value={String(overview.metrics.openPeriods)}
          caption="Base viva para permitir nuevos asientos."
          tone="emerald"
          icon={CalendarClock}
        />
        <KpiCard
          title="Vouchers draft"
          value={String(overview.metrics.draftVouchers)}
          caption="Ajustes aun editables antes del posteo."
          tone="ivory"
          icon={FileStack}
        />
        <KpiCard
          title="Vouchers posteados"
          value={String(overview.metrics.postedVouchers)}
          caption="Ya numerados y vinculados al journal."
          tone="ink"
          icon={Scale}
        />
        <KpiCard
          title="Asientos publicados"
          value={String(overview.metrics.postedEntries)}
          caption="Inmutables, con correccion por reversion."
          tone="ivory"
          icon={BookOpenText}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[30px] border-white/10 bg-[#0c1713] text-white shadow-[0_24px_60px_rgba(7,21,16,0.22)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Convenciones activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/74">
            <p>
              El posteo asigna la numeracion oficial solo al publicar. Cada voucher publicado crea su
              journal entry balanceado y deja audit trail con `organizationId`, actor e `idempotencyKey`.
            </p>
            <p>
              Los periodos `CLOSED` o `LOCKED` rechazan nuevas publicaciones. Los asientos publicados
              son de solo lectura y cualquier correccion entra por reversion, nunca por edicion directa.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="rounded-full bg-white text-slate-950 hover:bg-white/90">
                <Link href={`${baseHref}/periods`}>Gestionar periodos</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href={`${baseHref}/vouchers`}>Abrir vouchers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/92 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Checklist del sprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Control de periodos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Apertura operativa, cierre, bloqueo y reapertura con auditoria.
                  </p>
                </div>
                <StatusPill status="posted" />
              </div>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Posteo e idempotencia</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Numeracion robusta y proteccion contra doble posteo.
                  </p>
                </div>
                <StatusPill status="posted" />
              </div>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Journal y reversion</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Lectura consolidada con reversion trazable.
                  </p>
                </div>
                <StatusPill status="posted" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <BaseDataTable
          title="Periodos recientes"
          description="Ultimos periodos configurados en la organizacion."
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
              render: (row) => `${row.journalEntriesCount} asientos`,
            },
          ]}
          rows={overview.recentPeriods}
          emptyState={<EmptyState title="Sin periodos" description="Todavia no hay periodos contables visibles." />}
        />

        <BaseDataTable
          title="Vouchers recientes"
          description="Borradores y publicados con trazabilidad directa al journal."
          columns={[
            {
              key: "description",
              title: "Voucher",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-950">{row.voucherNumber ?? "Sin numerar"}</p>
                  <p className="text-xs text-slate-500">{row.description}</p>
                </div>
              ),
            },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status.toLowerCase() as "draft" | "posted" | "voided"} />,
            },
            {
              key: "debitTotal",
              title: "Total",
              render: (row) => formatMoney(row.debitTotal),
            },
          ]}
          rows={overview.recentVouchers}
          emptyState={<EmptyState title="Sin vouchers" description="Crea el primer voucher manual para poblar el core." />}
        />
      </div>

      <BaseDataTable
        title="Journal reciente"
        description="Asientos publicados listos para consulta y soporte."
        columns={[
          {
            key: "entryNumber",
            title: "Entry",
          },
          {
            key: "description",
            title: "Descripcion",
          },
          {
            key: "entryDateIso",
            title: "Fecha",
            render: (row) => formatDate(row.entryDateIso),
          },
          {
            key: "totalDebit",
            title: "Debito",
            render: (row) => formatMoney(row.totalDebit),
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
        ]}
        rows={overview.recentEntries}
        emptyState={<EmptyState title="Sin asientos" description="El journal aparecera cuando postees vouchers." />}
      />
    </div>
  );
}
