import Link from "next/link";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppShellProps = {
  organizationName: string;
  organizationSlug: string;
  userName?: string | null;
  children: ReactNode;
};

const navigation = [
  { href: "dashboard", label: "Dashboard" },
  { href: "admin", label: "Admin" },
  { href: "sales", label: "Ventas" },
  { href: "purchases", label: "Compras" },
  { href: "accounting", label: "Contabilidad" },
  { href: "treasury", label: "Tesorería" },
  { href: "reports", label: "Reportes" },
  { href: "settings", label: "Configuración" },
];

export function AppShell({
  organizationName,
  organizationSlug,
  userName,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,135,95,0.22),_transparent_24%),linear-gradient(180deg,_#f9fbf8_0%,_#f3f6f3_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/20 bg-[#061711] px-5 py-6 text-white shadow-[0_0_80px_rgba(2,15,9,0.45)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">KAIKO</p>
            <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
              {organizationName}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/70">
              Control financiero claro, trazable y listo para escalar.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={`/${organizationSlug}/${item.href}`}
                className={cn(
                  "flex items-center rounded-2xl px-4 py-3 text-sm text-emerald-50/85 transition",
                  "hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Separator className="my-8 bg-white/10" />

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-50/90">
            <p className="font-medium">Modo NIIF + Colombia</p>
            <p className="mt-2 text-emerald-50/70">
              Motor contable desacoplado, tax engine parametrizable y trazabilidad total.
            </p>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-emerald-950/5 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">Workspace</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{organizationName}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                {userName ?? "Usuario KAIKO"}
              </div>
            </div>
          </header>

          <div className="flex-1 px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
