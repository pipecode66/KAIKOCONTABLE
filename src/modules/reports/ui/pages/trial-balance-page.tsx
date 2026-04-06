import { BaseDataTable } from "@/components/data-table/base-data-table";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import type { TrialBalanceReportDto } from "@/modules/reports/dto/reports.dto";
import { RequestReportExportDialog } from "@/modules/reports/ui/components/request-report-export-dialog";
import { ReportsSubnav } from "@/modules/reports/ui/components/reports-subnav";

type TrialBalancePageProps = {
  organizationSlug: string;
  organizationName: string;
  from: string;
  to: string;
  report: TrialBalanceReportDto;
  formatMoney: (value: string) => string;
};

export function TrialBalancePage({
  organizationSlug,
  organizationName,
  from,
  to,
  report,
  formatMoney,
}: TrialBalancePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Balance de comprobacion"
        description="Apertura, debitos, creditos y cierre por cuenta para validar el mayor."
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <ReportsSubnav organizationSlug={organizationSlug} activeKey="trial-balance" />
            <RequestReportExportDialog organizationSlug={organizationSlug} reportKey="trial-balance" defaultFrom={from} defaultTo={to} />
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
        <KpiCard title="Apertura" value={formatMoney(report.totals.openingBalance)} caption="Saldo inicial agregado." tone="ivory" />
        <KpiCard title="Debitos" value={formatMoney(report.totals.periodDebit)} caption="Movimiento debito del periodo." tone="emerald" />
        <KpiCard title="Creditos" value={formatMoney(report.totals.periodCredit)} caption="Movimiento credito del periodo." tone="emerald" />
        <KpiCard title="Cierre" value={formatMoney(report.totals.closingBalance)} caption="Saldo final agregado." tone="ink" />
      </section>

      <BaseDataTable
        title="Mayor resumido"
        description="Lectura por cuenta de apertura, movimiento y cierre."
        rows={report.rows}
        columns={[
          { key: "code", title: "Codigo" },
          { key: "name", title: "Cuenta" },
          { key: "openingBalance", title: "Apertura", render: (row) => formatMoney(row.openingBalance) },
          { key: "periodDebit", title: "Debito", render: (row) => formatMoney(row.periodDebit) },
          { key: "periodCredit", title: "Credito", render: (row) => formatMoney(row.periodCredit) },
          { key: "closingBalance", title: "Cierre", render: (row) => formatMoney(row.closingBalance) },
        ]}
      />
    </div>
  );
}
