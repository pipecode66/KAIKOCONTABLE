"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  type WorkspaceNavigationItem,
  workspaceNavigation,
} from "@/components/layout/workspace-navigation";

type WorkspaceSidebarNavProps = {
  organizationSlug: string;
  organizationName: string;
};

function NavList({
  organizationSlug,
  items,
}: {
  organizationSlug: string;
  items: WorkspaceNavigationItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const href = `/${organizationSlug}/${item.href}`;
        const isActive = pathname.startsWith(href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-[22px] border px-4 py-3.5 transition",
              isActive
                ? "border-emerald-300/30 bg-white text-slate-950 shadow-[0_12px_30px_rgba(6,23,17,0.2)]"
                : "border-transparent text-emerald-50/78 hover:border-white/8 hover:bg-white/6 hover:text-white",
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl",
                isActive ? "bg-emerald-50 text-emerald-700" : "bg-white/6 text-emerald-100/80",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p
                className={cn(
                  "truncate text-xs",
                  isActive ? "text-slate-500" : "text-emerald-100/52",
                )}
              >
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceSidebarNav({
  organizationSlug,
  organizationName,
}: WorkspaceSidebarNavProps) {
  return (
    <aside className="hidden h-screen flex-col border-r border-white/8 bg-[linear-gradient(180deg,#071510_0%,#081d16_100%)] px-5 py-6 text-white shadow-[0_0_90px_rgba(2,15,9,0.42)] lg:flex">
      <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 kaiko-glass">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/70">KAIKO</p>
            <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
              {organizationName}
            </h1>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-2 text-emerald-100">
            <Sparkles className="size-4" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-emerald-100/68">
          Control financiero claro, multiempresa y listo para crecimiento real.
        </p>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto pr-1">
        <NavList organizationSlug={organizationSlug} items={workspaceNavigation} />
      </div>

      <div className="mt-6 rounded-[26px] border border-emerald-300/14 bg-emerald-400/8 p-4 text-sm text-emerald-50/88">
        <p className="font-medium">NIIF + capa fiscal Colombia</p>
        <p className="mt-2 leading-6 text-emerald-50/68">
          Shell preparado para motor contable, jobs, outbox, conciliacion y reporting premium.
        </p>
      </div>
    </aside>
  );
}
