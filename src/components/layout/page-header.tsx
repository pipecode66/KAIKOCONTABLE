import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-emerald-950/5 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] lg:flex lg:items-end lg:justify-between">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(17,163,111,0.14),_transparent_60%)] lg:block" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">{eyebrow}</p>
          {badge ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {badge}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-slate-950 lg:text-[2.15rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-0">{actions}</div> : null}
    </div>
  );
}
