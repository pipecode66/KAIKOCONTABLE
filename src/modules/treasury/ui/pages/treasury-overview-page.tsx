import { Landmark, ReceiptText, ScanSearch, Wallet } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TreasuryOverviewDto } from "@/modules/treasury/dto/treasury.dto";
import { TreasurySubnav } from "@/modules/treasury/ui/components/treasury-subnav";

type TreasuryOverviewPageProps = {
  overview: TreasuryOverviewDto;
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function TreasuryOverviewPage({
  overview,
  formatMoney,
  formatDate,
}: TreasuryOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesoreria"
        title="Bancos, caja y conciliacion operativa"
        description="Control real de liquidez: pagos, traslados, extractos importados, conciliacion asistida y estado de caja conectados al backend contable."
        badge={overview.organizationName}
        actions={<TreasurySubnav organizationSlug={overview.organizationSlug} activeKey="overview" />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Bancos disponibles"
          value={formatMoney(overview.metrics.availableBanks)}
          caption="Saldo operativo agregado en cuentas bancarias."
          tone="emerald"
          icon={Landmark}
        />
        <KpiCard
          title="Caja disponible"
          value={formatMoney(overview.metrics.availableCash)}
          caption="Liquidez registrada en cajas activas."
          tone="ivory"
          icon={Wallet}
        />
        <KpiCard
          title="Extractos pendientes"
          value={String(overview.metrics.pendingImports)}
          caption="CSV cargados aun en proceso o con fallo."
          tone="ink"
          icon={ReceiptText}
        />
        <KpiCard
          title="Conciliaciones abiertas"
          value={String(overview.metrics.openReconciliations)}
          caption="Ventanas bancarias que aun requieren confirmacion."
          tone="ivory"
          icon={ScanSearch}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[30px] border-white/10 bg-[linear-gradient(180deg,#0c1713_0%,#10231d_100%)] text-white shadow-[0_30px_80px_rgba(6,23,17,0.3)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-white">Lectura de liquidez</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {overview.bankBalances.map((balance) => (
              <div key={balance.id} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <p className="font-medium text-white">
                  {balance.code} · {balance.name}
                </p>
                <p className="mt-3 font-heading text-2xl">{formatMoney(balance.balance)}</p>
                <p className="mt-2 text-sm text-white/70">Disponible para pagos, recaudos y conciliacion.</p>
              </div>
            ))}
            {overview.bankBalances.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/6 p-5 text-sm text-white/72">
                No hay cuentas bancarias activas para mostrar.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Estado de caja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.cashBalances.map((balance) => (
              <div key={balance.id} className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {balance.code} · {balance.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">Caja activa para movimientos internos y arqueo.</p>
                  </div>
                  <p className="font-heading text-lg text-slate-950">{formatMoney(balance.balance)}</p>
                </div>
              </div>
            ))}
            {overview.cashBalances.length === 0 ? (
              <EmptyState
                title="Sin cajas activas"
                description="Activa una caja o registra movimientos para empezar a controlar efectivo."
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <BaseDataTable
          title="Pagos recientes"
          description="Cobros y desembolsos mas recientes publicados o en borrador."
          rows={overview.recentPayments}
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
              key: "amount",
              title: "Monto",
              render: (row) => formatMoney(row.amount),
            },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status.toLowerCase() as "draft" | "posted" | "voided"} />,
            },
          ]}
          emptyState={<EmptyState title="Sin pagos" description="Los pagos apareceran cuando registres cobros o salidas de tesoreria." />}
        />

        <BaseDataTable
          title="Traslados recientes"
          description="Movimientos internos entre bancos y caja."
          rows={overview.recentTransfers}
          columns={[
            {
              key: "reference",
              title: "Traslado",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-950">{row.reference ?? "Sin referencia"}</p>
                  <p className="text-xs text-slate-500">
                    {row.sourceLabel} → {row.destinationLabel}
                  </p>
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
          ]}
          emptyState={<EmptyState title="Sin traslados" description="Usa traslados para mover liquidez entre cuentas internas." />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BaseDataTable
          title="Extractos importados"
          description="Ultimos archivos CSV procesados para conciliacion bancaria."
          rows={overview.recentImports}
          columns={[
            { key: "fileName", title: "Archivo" },
            { key: "bankAccountName", title: "Cuenta" },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status.toLowerCase() as "pending" | "failed" | "posted"} />,
            },
            {
              key: "importedAtIso",
              title: "Importado",
              render: (row) => (row.importedAtIso ? formatDate(row.importedAtIso) : "Pendiente"),
            },
          ]}
          emptyState={<EmptyState title="Sin extractos" description="Carga un CSV bancario para empezar la conciliacion asistida." />}
        />

        <BaseDataTable
          title="Conciliaciones recientes"
          description="Ventanas de conciliacion con sugerencias listas para confirmar."
          rows={overview.recentReconciliations}
          columns={[
            { key: "bankAccountName", title: "Cuenta" },
            {
              key: "periodEndIso",
              title: "Corte",
              render: (row) => formatDate(row.periodEndIso),
            },
            {
              key: "lineCount",
              title: "Cruces",
              render: (row) => `${row.lineCount} aplicados`,
            },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status.toLowerCase() as "draft" | "posted" | "closed"} />,
            },
          ]}
          emptyState={<EmptyState title="Sin conciliaciones" description="Crea la primera conciliacion para ver sugerencias de match." />}
        />
      </div>
    </div>
  );
}
