import { cn } from "@/lib/utils";

type StatusPillProps = {
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

const styles: Record<StatusPillProps["status"], string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  posted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  voided: "border-rose-200 bg-rose-50 text-rose-700",
  open: "border-sky-200 bg-sky-50 text-sky-700",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  locked: "border-violet-200 bg-violet-50 text-violet-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-700",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        styles[status],
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
