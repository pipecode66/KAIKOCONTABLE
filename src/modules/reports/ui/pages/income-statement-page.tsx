import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import type { IncomeStatementReportDto } from "@/modules/reports/dto/reports.dto";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";

type IncomeStatementPageProps = {
  organizationSlug: string;
  organizationName: string;
  from: string;
  to: string;
  report: IncomeStatementReportDto;
  formatMoney: (value: string) => string;
};

export function IncomeStatementPage({
  organizationSlug,
  organizationName,
  from,
  to,
  report,
  formatMoney,
}: IncomeStatementPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Estado de resultados"
        description="Resultado operativo del periodo con ingresos, costo y gasto separados por cuenta."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="income-statement" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey="income-statement" defaultFrom={from} defaultTo={to} />
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
        <KpiCard title="Utilidad bruta" value={formatMoney(report.grossProfit)} caption="Ingresos menos costo de ventas." tone="emerald" />
        <KpiCard title="Utilidad neta" value={formatMoney(report.netIncome)} caption="Resultado final del periodo." tone="ink" />
      </section>

      {report.sections.map((section) => (
        <BaseDataTable
          key={section.key}
          title={section.title}
          description={`Total ${formatMoney(section.total)}`}
          rows={section.rows}
          columns={[
            { key: "code", title: "Codigo" },
            { key: "name", title: "Cuenta" },
            { key: "amount", title: "Valor", render: (row) => formatMoney(row.amount) },
          ]}
          emptyState={<EmptyState title={`Sin ${section.title.toLowerCase()}`} description="No hubo movimiento para este segmento en el rango indicado." />}
        />
      ))}
    </div>
  );
}
