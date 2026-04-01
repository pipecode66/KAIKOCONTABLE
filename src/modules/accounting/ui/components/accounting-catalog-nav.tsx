import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";

const items: Array<{ key: AccountingCatalogKey | "ledger-accounts"; label: string; href: string }> = [
  { key: "ledger-accounts", label: "Plan de cuentas", href: "/ledger-accounts" },
  { key: "third-parties", label: "Terceros", href: "/catalogs/third-parties" },
  { key: "taxes", label: "Impuestos", href: "/catalogs/taxes" },
  { key: "tax-rules", label: "Tax rules", href: "/catalogs/tax-rules" },
  { key: "cost-centers", label: "Centros de costo", href: "/catalogs/cost-centers" },
  { key: "catalog-items", label: "Items", href: "/catalogs/catalog-items" },
];

type AccountingCatalogNavProps = {
  organizationSlug: string;
  activeKey: AccountingCatalogKey | "ledger-accounts";
};

export function AccountingCatalogNav({ organizationSlug, activeKey }: AccountingCatalogNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const href = `/${organizationSlug}/accounting${item.href}`;

        return (
          <Link
            key={item.key}
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
