import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type KpiCardTone = "emerald" | "ink" | "ivory";
type KpiTrend = "up" | "down" | "flat";

type KpiCardProps = {
  title: string;
  value: string;
  caption: string;
  trendLabel?: string;
  trend?: KpiTrend;
  tone?: KpiCardTone;
  icon?: LucideIcon;
};

const toneStyles: Record<KpiCardTone, string> = {
  emerald:
    "bg-[linear-gradient(180deg,#0f875f_0%,#0d6d51_100%)] text-white shadow-[0_24px_60px_rgba(15,135,95,0.22)]",
  ink: "bg-[linear-gradient(180deg,#0c1713_0%,#10231d_100%)] text-white shadow-[0_24px_60px_rgba(7,21,16,0.2)]",
  ivory: "bg-white text-slate-950 shadow-[0_20px_52px_rgba(15,23,42,0.08)]",
};

function TrendIcon({ trend }: { trend: KpiTrend }) {
  if (trend === "up") {
    return <ArrowUpRight className="size-3.5" />;
  }

  if (trend === "down") {
    return <ArrowDownRight className="size-3.5" />;
  }

  return <Minus className="size-3.5" />;
}

export function KpiCard({
  title,
  value,
  caption,
  trendLabel,
  trend = "flat",
  tone = "ivory",
  icon: Icon,
}: KpiCardProps) {
  const isLight = tone === "ivory";

  return (
    <article
      className={cn(
        "rounded-[30px] border px-5 py-5 transition duration-200 hover:-translate-y-0.5",
        isLight ? "border-emerald-950/5" : "border-white/10",
        toneStyles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-white/72")}>{title}</p>
          <p className="mt-4 font-heading text-[2rem] font-semibold leading-none tracking-tight">
            {value}
          </p>
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl",
              isLight ? "bg-emerald-50 text-emerald-700" : "bg-white/10 text-white",
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className={cn("text-sm leading-6", isLight ? "text-slate-600" : "text-white/72")}>
          {caption}
        </p>
        {trendLabel ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              isLight ? "bg-emerald-50 text-emerald-700" : "bg-white/10 text-white",
            )}
          >
            <TrendIcon trend={trend} />
            {trendLabel}
          </div>
        ) : null}
      </div>
    </article>
  );
}
