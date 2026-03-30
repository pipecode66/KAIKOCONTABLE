import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardOverview } from "@/modules/reports/application/queries/get-dashboard-overview";

export async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centro de mando"
        title="Visión ejecutiva de la operación"
        description="Una lectura rápida del estado financiero, tesorería y alertas operativas de la organización activa."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border-emerald-950/5 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Movimientos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentMovements.map((movement) => (
              <div
                key={movement.title}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{movement.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{movement.amount}</p>
                </div>
                <StatusPill status={movement.status as "draft" | "posted" | "voided"} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-emerald-950/5 bg-[#071510] text-white shadow-[0_30px_80px_rgba(6,23,17,0.4)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-white">Alertas operativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.alerts.map((alert) => (
              <div key={alert} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {alert}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
