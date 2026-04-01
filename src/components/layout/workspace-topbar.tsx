"use client";

import type { ReactNode } from "react";
import { startTransition, useMemo, useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { WorkspaceBreadcrumbs } from "@/components/layout/workspace-breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkspaceTopbarProps = {
  organizationSlug: string;
  organizationName: string;
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  userName?: string | null;
  userEmail?: string | null;
  mobileNav: ReactNode;
};

function getUserInitials(input?: string | null) {
  if (!input) {
    return "KK";
  }

  return input
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function WorkspaceTopbar({
  organizationSlug,
  organizationName,
  organizations,
  userName,
  userEmail,
  mobileNav,
}: WorkspaceTopbarProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const activeOrganizationValue = useMemo(() => organizationSlug, [organizationSlug]);

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/6 bg-white/78 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {mobileNav}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-700/58">
              Workspace
            </p>
            <WorkspaceBreadcrumbs
              organizationSlug={organizationSlug}
              organizationName={organizationName}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <Select
              value={activeOrganizationValue}
              onValueChange={(value) => {
                router.push(`/${value}/dashboard`);
              }}
            >
              <SelectTrigger className="w-[240px] rounded-full border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
                <SelectValue placeholder="Selecciona organizacion" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.slug}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
          >
            <Bell className="size-4" />
            <span className="sr-only">Notificaciones</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-auto rounded-full border-slate-200 bg-white px-2.5 py-2 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
              >
                <Avatar className="size-9 border border-emerald-100">
                  <AvatarFallback className="bg-emerald-50 font-heading text-emerald-700">
                    {getUserInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-slate-900">
                    {userName ?? "Usuario KAIKO"}
                  </p>
                  <p className="text-xs text-slate-500">{userEmail ?? "workspace@kaiko.local"}</p>
                </div>
                <ChevronDown className="size-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-medium text-slate-900">{userName ?? "Usuario KAIKO"}</p>
                <p className="text-xs text-slate-500">{userEmail ?? "workspace@kaiko.local"}</p>
              </div>
              <DropdownMenuItem
                disabled={isSigningOut}
                onClick={() => {
                  setIsSigningOut(true);
                  startTransition(() => {
                    void signOut({
                      callbackUrl: "/login",
                    });
                  });
                }}
              >
                <LogOut className="mr-2 size-4" />
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
