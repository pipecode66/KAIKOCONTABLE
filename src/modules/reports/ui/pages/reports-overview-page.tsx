import { FileSpreadsheet, Landmark, Receipt, Scale } from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportsOverviewDto } from "@/modules/reports/dto/reports.dto";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";

type ReportsOverviewPageProps = {
  organizationSlug: string;
  organizationName: string;
  overview: ReportsOverviewDto;
  formatMoney: (value: string) => string;
};

export function ReportsOverviewPage({
  organizationSlug,
  organizationName,
  overview,
  formatMoney,
}: ReportsOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Paquete financiero y analitica operativa"
        description="Consulta financiera real alimentada por asientos publicados, documentos abiertos y tesoreria ya conciliable."
        badge={organizationName}
        actions={<ReportsSubnav organizationSlug={organizationSlug} activeKey="overview" />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Activos" value={formatMoney(overview.metrics.assets)} caption="Fotografia financiera actual." tone="emerald" icon={Landmark} />
        <KpiCard title="Pasivos" value={formatMoney(overview.metrics.liabilities)} caption="Obligaciones abiertas y saldos contables." tone="ivory" icon={Receipt} />
        <KpiCard title="Patrimonio" value={formatMoney(overview.metrics.equity)} caption="Base acumulada del negocio." tone="ink" icon={Scale} />
        <KpiCard title="Cola de exportacion" value={String(overview.exportQueue.pending)} caption={`${overview.exportQueue.completed} exportaciones listas para descarga.`} tone="ivory" icon={FileSpreadsheet} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[30px] border-white/10 bg-[linear-gradient(180deg,#0c1713_0%,#10231d_100%)] text-white shadow-[0_30px_80px_rgba(6,23,17,0.3)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-white">Pulso del periodo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm text-white/72">Ingresos del mes</p>
              <p className="mt-3 font-heading text-2xl">{formatMoney(overview.metrics.monthlyRevenue)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <p className="text-sm text-white/72">Gasto operativo + costo</p>
              <p className="mt-3 font-heading text-2xl">{formatMoney(overview.metrics.monthlyExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Cartera abierta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4">
              <p className="text-sm text-slate-600">Cuentas por cobrar</p>
              <p className="mt-2 font-heading text-2xl text-slate-950">{formatMoney(overview.metrics.openReceivables)}</p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/75 p-4">
              <p className="text-sm text-slate-600">Cuentas por pagar</p>
              <p className="mt-2 font-heading text-2xl text-slate-950">{formatMoney(overview.metrics.openPayables)}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
