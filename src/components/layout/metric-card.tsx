import { KpiCard } from "@/components/layout/kpi-card";

type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
};

export function MetricCard({ title, value, trend }: MetricCardProps) {
  return (
    <KpiCard
      title={title}
      value={value}
      caption={trend}
      trendLabel={trend}
      trend="up"
      tone="ivory"
    />
  );
}
