import { BaseDataTable } from "@/components/data-table/base-data-table";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import type { CashFlowReportDto } from "@/modules/reports/dto/reports.dto";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";

type CashFlowPageProps = {
  organizationSlug: string;
  organizationName: string;
  from: string;
  to: string;
  report: CashFlowReportDto;
  formatMoney: (value: string) => string;
  formatDate: (value: string) => string;
};

export function CashFlowPage({
  organizationSlug,
  organizationName,
  from,
  to,
  report,
  formatMoney,
  formatDate,
}: CashFlowPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Flujo de caja"
        description="Lectura directa de entradas, salidas y movimientos internos desde tesoreria posteada."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="cash-flow" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey="cash-flow" defaultFrom={from} defaultTo={to} />
          </div>
        }
      />

      <form className="flex flex-wrap items-end gap-3 rounded-[28px] border border-emerald-950/5 bg-white/95 p-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Desde</span>
          <input type="date" name="from" defaultValue={from} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Hasta</span>
          <input type="date" name="to" defaultValue={to} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <button type="submit" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Actualizar
        </button>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Entradas operativas" value={formatMoney(report.operatingInflows)} caption="Cobros recibidos." tone="emerald" />
        <KpiCard title="Salidas operativas" value={formatMoney(report.operatingOutflows)} caption="Pagos efectuados." tone="ivory" />
        <KpiCard title="Traslados internos" value={formatMoney(report.internalTransfers)} caption="Movimiento interno sin impacto neto." tone="ivory" />
        <KpiCard title="Cambio neto" value={formatMoney(report.netCashChange)} caption="Variacion neta del periodo." tone="ink" />
      </section>

      <BaseDataTable
        title="Movimientos"
        description="Detalle de tesoreria utilizado para el flujo de caja directo."
        rows={report.rows}
        columns={[
          { key: "dateIso", title: "Fecha", render: (row) => formatDate(row.dateIso) },
          { key: "kind", title: "Tipo" },
          { key: "label", title: "Referencia" },
          { key: "counterparty", title: "Contraparte" },
          { key: "inflow", title: "Entrada", render: (row) => formatMoney(row.inflow) },
          { key: "outflow", title: "Salida", render: (row) => formatMoney(row.outflow) },
          { key: "internalAmount", title: "Interno", render: (row) => formatMoney(row.internalAmount) },
        ]}
      />
    </div>
  );
}
