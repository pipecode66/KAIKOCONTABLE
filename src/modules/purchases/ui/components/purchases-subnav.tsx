import Link from "next/link";

import { cn } from "@/lib/utils";

const items = [
  { key: "overview", label: "Resumen", href: "" },
  { key: "bills", label: "Facturas", href: "/bills" },
] as const;

type PurchasesSubnavProps = {
  organizationSlug: string;
  activeKey: (typeof items)[number]["key"];
};

export function PurchasesSubnav({ organizationSlug, activeKey }: PurchasesSubnavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/${organizationSlug}/purchases${item.href}`}
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
