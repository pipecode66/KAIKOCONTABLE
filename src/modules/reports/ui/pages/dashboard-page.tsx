import { Activity, Building2, CreditCard, Landmark, ShieldCheck, Wallet } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardPageProps = {
  overview: Awaited<ReturnType<typeof import("@/modules/reports/application/queries/get-dashboard-overview").getDashboardOverview>>;
  formatMoney: (value: string) => string;
};

export async function DashboardPage({ overview, formatMoney }: DashboardPageProps) {
  const metricIcons = [Wallet, CreditCard, Activity, Landmark, Building2, ShieldCheck];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control tower"
        title="Dashboard ejecutivo KAIKO"
        description="Lectura inmediata de ingresos, liquidez, cartera, obligaciones y focos operativos con datos reales del workspace."
        badge="Live"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.metrics.map((metric, index) => (
          <KpiCard
            key={metric.title}
            title={metric.title}
            value={formatMoney(metric.value)}
            caption={metric.caption}
            trendLabel={metric.trendLabel}
            trend={metric.trend}
            tone={metric.tone}
            icon={metricIcons[index]}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-[30px] border-white/10 bg-[linear-gradient(180deg,#0c1713_0%,#10231d_100%)] text-white shadow-[0_30px_80px_rgba(6,23,17,0.3)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-white">Resumen ejecutivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {overview.executiveNotes.map((note) => (
              <div key={note.title} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <p className="font-medium text-white">{note.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/72">{note.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Alertas operativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.alerts.map((alert) => (
              <div key={alert.title} className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{alert.description}</p>
                  </div>
                  <StatusPill status={alert.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <BaseDataTable
          title="Actividad reciente"
          description="Documentos y movimientos reales mas recientes dentro del workspace."
          rows={overview.recentMovements}
          columns={[
            { key: "document", title: "Documento" },
            { key: "module", title: "Modulo" },
            { key: "counterparty", title: "Detalle" },
            { key: "amount", title: "Monto", render: (row) => formatMoney(row.amount) },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status} />,
            },
          ]}
        />

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Readiness por stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.readinessLanes.map((lane) => (
              <div key={lane.title} className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{lane.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{lane.description}</p>
                  </div>
                  <StatusPill status={lane.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <BaseDataTable
        title="Postura del workspace"
        description="Lectura transversal del estado de los modulos principales dentro del shell KAIKO."
        rows={overview.modulePosture}
        columns={[
          { key: "module", title: "Modulo" },
          { key: "headline", title: "Headline" },
          { key: "posture", title: "Lectura" },
          {
            key: "status",
            title: "Estado",
            render: (row) => <StatusPill status={row.status} />,
          },
        ]}
      />
    </div>
  );
}
