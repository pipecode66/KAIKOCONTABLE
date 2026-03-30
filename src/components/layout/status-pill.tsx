import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: "draft" | "posted" | "voided";
};

const styles: Record<StatusPillProps["status"], string> = {
  draft: "bg-amber-100 text-amber-800",
  posted: "bg-emerald-100 text-emerald-800",
  voided: "bg-rose-100 text-rose-700",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  );
}
