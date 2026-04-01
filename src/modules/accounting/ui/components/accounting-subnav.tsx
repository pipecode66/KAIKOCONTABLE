import Link from "next/link";

import { cn } from "@/lib/utils";

const items = [
  { href: "", label: "Overview" },
  { href: "/periods", label: "Periodos" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/journal", label: "Journal" },
  { href: "/ledger-accounts", label: "Plan de cuentas" },
] as const;

type AccountingSubnavProps = {
  organizationSlug: string;
  activePath: string;
};

export function AccountingSubnav({ organizationSlug, activePath }: AccountingSubnavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const href = `/${organizationSlug}/accounting${item.href}`;
        const isActive = activePath === href;

        return (
          <Link
            key={item.href || "overview"}
            href={href}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_14px_32px_rgba(15,135,95,0.18)]"
                : "border-emerald-950/10 bg-white/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
