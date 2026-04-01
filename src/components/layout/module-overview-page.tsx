import type { LucideIcon } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModuleMetric = {
  title: string;
  value: string;
  caption: string;
  trendLabel?: string;
  trend?: "up" | "down" | "flat";
  tone?: "emerald" | "ink" | "ivory";
  icon?: LucideIcon;
};

type ModuleLane = {
  title: string;
  description: string;
  tone?: "light" | "dark";
};

type ModuleChecklistItem = {
  title: string;
  description: string;
  status:
    | "draft"
    | "posted"
    | "voided"
    | "open"
    | "closed"
    | "locked"
    | "pending"
    | "failed"
    | "active"
    | "inactive"
    | "archived";
};

type ModuleTableRow = {
  stream: string;
  focus: string;
  readiness: string;
};

type ModuleOverviewPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  metrics: ModuleMetric[];
  lanes: ModuleLane[];
  checklist: ModuleChecklistItem[];
  table: {
    title: string;
    description: string;
    rows: ModuleTableRow[];
  };
  emptyState: {
    title: string;
    description: string;
  };
};

export function ModuleOverviewPage({
  eyebrow,
  title,
  description,
  badge,
  metrics,
  lanes,
  checklist,
  table,
  emptyState,
}: ModuleOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} badge={badge} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <KpiCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          {lanes.map((lane) => (
            <Card
              key={lane.title}
              className={
                lane.tone === "dark"
                  ? "rounded-[30px] border-white/10 bg-[#0c1713] text-white shadow-[0_24px_60px_rgba(7,21,16,0.22)]"
                  : "rounded-[30px] border-emerald-950/5 bg-white/92 shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
              }
            >
              <CardHeader>
                <CardTitle className="font-heading text-xl">{lane.title}</CardTitle>
              </CardHeader>
              <CardContent
                className={lane.tone === "dark" ? "text-sm leading-7 text-white/74" : "text-sm leading-7 text-slate-600"}
              >
                {lane.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/92 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Checklist visual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <BaseDataTable
        title={table.title}
        description={table.description}
        columns={[
          { key: "stream", title: "Stream" },
          { key: "focus", title: "Foco operativo" },
          { key: "readiness", title: "Readiness" },
        ]}
        rows={table.rows}
      />

      <EmptyState title={emptyState.title} description={emptyState.description} />
    </div>
  );
}
