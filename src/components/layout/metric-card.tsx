type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
};

export function MetricCard({ title, value, trend }: MetricCardProps) {
  return (
    <article className="rounded-[28px] border border-emerald-950/5 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-4 font-heading text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-3 text-sm text-emerald-700">{trend}</p>
    </article>
  );
}
