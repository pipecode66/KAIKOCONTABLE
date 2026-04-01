import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-[30px] border border-dashed border-emerald-200 bg-white/85 p-10 text-center shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-700">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-5 font-heading text-2xl font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
