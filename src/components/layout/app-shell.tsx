import type { ReactNode } from "react";

import { WorkspaceMobileNav } from "@/components/layout/workspace-mobile-nav";
import { WorkspaceSidebarNav } from "@/components/layout/workspace-sidebar-nav";
import { WorkspaceTopbar } from "@/components/layout/workspace-topbar";

type AppShellProps = {
  organizationName: string;
  organizationSlug: string;
  userName?: string | null;
  userEmail?: string | null;
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  children: ReactNode;
};

export function AppShell({
  organizationName,
  organizationSlug,
  userName,
  userEmail,
  organizations,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,135,95,0.18),_transparent_24%),linear-gradient(180deg,_#f9fbf8_0%,_#f3f6f3_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[308px_minmax(0,1fr)]">
        <WorkspaceSidebarNav
          organizationSlug={organizationSlug}
          organizationName={organizationName}
        />

        <main className="flex min-h-screen flex-col">
          <WorkspaceTopbar
            organizationSlug={organizationSlug}
            organizationName={organizationName}
            organizations={organizations}
            userName={userName}
            userEmail={userEmail}
            mobileNav={
              <WorkspaceMobileNav
                organizationSlug={organizationSlug}
                organizationName={organizationName}
              />
            }
          />

          <div className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
