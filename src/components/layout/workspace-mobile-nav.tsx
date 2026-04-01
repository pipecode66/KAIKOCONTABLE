"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { workspaceNavigation } from "@/components/layout/workspace-navigation";

type WorkspaceMobileNavProps = {
  organizationSlug: string;
  organizationName: string;
};

export function WorkspaceMobileNav({
  organizationSlug,
  organizationName,
}: WorkspaceMobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl border-slate-200 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.08)] lg:hidden"
        >
          <Menu className="size-4" />
          <span className="sr-only">Abrir navegacion</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[90vw] max-w-sm border-r border-white/8 bg-[linear-gradient(180deg,#071510_0%,#081d16_100%)] p-0 text-white"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-5">
          <SheetTitle className="text-white">{organizationName}</SheetTitle>
          <SheetDescription className="text-emerald-50/65">
            Navegacion persistente del workspace KAIKO.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-1.5 px-4 py-5">
          {workspaceNavigation.map((item) => {
            const href = `/${organizationSlug}/${item.href}`;
            const isActive = pathname.startsWith(href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[22px] border px-4 py-3.5 transition",
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
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={cn("text-xs", isActive ? "text-slate-500" : "text-emerald-100/52")}>
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
