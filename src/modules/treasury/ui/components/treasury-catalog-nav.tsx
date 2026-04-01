import Link from "next/link";

import { cn } from "@/lib/utils";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";

const items: Array<{ key: TreasuryCatalogKey; label: string }> = [
  { key: "payment-methods", label: "Metodos de pago" },
  { key: "bank-accounts", label: "Cuentas bancarias" },
  { key: "cash-accounts", label: "Cajas" },
];

type TreasuryCatalogNavProps = {
  organizationSlug: string;
  activeKey: TreasuryCatalogKey;
};

export function TreasuryCatalogNav({ organizationSlug, activeKey }: TreasuryCatalogNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const href = `/${organizationSlug}/treasury/catalogs/${item.key}`;

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
