import Link from "next/link";

import { cn } from "@/lib/utils";

const items = [
  { key: "overview", label: "Resumen", href: "" },
  { key: "balance-sheet", label: "Balance general", href: "/balance-sheet" },
  { key: "income-statement", label: "Resultados", href: "/income-statement" },
  { key: "trial-balance", label: "Comprobacion", href: "/trial-balance" },
  { key: "receivables", label: "CxC", href: "/receivables" },
  { key: "payables", label: "CxP", href: "/payables" },
  { key: "aging", label: "Aging", href: "/aging" },
  { key: "cash-flow", label: "Flujo de caja", href: "/cash-flow" },
  { key: "exports", label: "Exportaciones", href: "/exports" },
] as const;

type ReportsSubnavProps = {
  organizationSlug: string;
  activeKey: (typeof items)[number]["key"];
};

export function ReportsSubnav({ organizationSlug, activeKey }: ReportsSubnavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/${organizationSlug}/reports${item.href}`}
          className={cn(
            "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
            item.key === activeKey
              ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_14px_32px_rgba(15,135,95,0.18)]"
              : "border-emerald-950/10 bg-white/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
