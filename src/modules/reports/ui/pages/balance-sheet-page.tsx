import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import type { BalanceSheetReportDto } from "@/modules/reports/dto/reports.dto";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";

type BalanceSheetPageProps = {
  organizationSlug: string;
  organizationName: string;
  asOf: string;
  report: BalanceSheetReportDto;
  formatMoney: (value: string) => string;
};

export function BalanceSheetPage({
  organizationSlug,
  organizationName,
  asOf,
  report,
  formatMoney,
}: BalanceSheetPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Balance general"
        description="Posicion financiera por fecha de corte, construida desde asientos publicados."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="balance-sheet" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey="balance-sheet" defaultAsOf={asOf} />
          </div>
        }
      />

      <form className="flex flex-wrap items-end gap-3 rounded-[28px] border border-emerald-950/5 bg-white/95 p-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Fecha de corte</span>
          <input type="date" name="asOf" defaultValue={asOf} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <button type="submit" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Actualizar
        </button>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Activos" value={formatMoney(report.totalAssets)} caption="Saldo total de activos." tone="emerald" />
        <KpiCard title="Pasivos + patrimonio" value={formatMoney(report.totalLiabilitiesAndEquity)} caption="Debe cuadrar contra los activos." tone="ivory" />
        <KpiCard title="Diferencia" value={formatMoney(String(Number(report.totalAssets) - Number(report.totalLiabilitiesAndEquity)))} caption="Lectura rapida de balanceo." tone="ink" />
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
            { key: "amount", title: "Saldo", render: (row) => formatMoney(row.amount) },
          ]}
          emptyState={<EmptyState title={`Sin ${section.title.toLowerCase()}`} description="No hay saldos para la fecha seleccionada." />}
        />
      ))}
    </div>
  );
}
