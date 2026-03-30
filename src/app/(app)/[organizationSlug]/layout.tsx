import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { resolveActiveOrganization } from "@/modules/organizations/application/use-cases/resolve-active-organization";

export const dynamic = "force-dynamic";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { organizationSlug } = await params;

  const membership = await resolveActiveOrganization(session.user.id, organizationSlug).catch(
    () => null,
  );

  if (!membership) {
    redirect("/");
  }

  return (
    <AppShell
      organizationName={membership.organization.name}
      organizationSlug={membership.organization.slug}
      userName={session.user.name}
    >
      {children}
    </AppShell>
  );
}
