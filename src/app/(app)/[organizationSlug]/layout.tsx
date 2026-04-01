import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { getAccessibleOrganizations } from "@/modules/organizations/application/queries/get-accessible-organizations";
import { recordOrganizationAccess } from "@/modules/organizations/application/use-cases/record-organization-access";
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

  await recordOrganizationAccess({
    membershipId: membership.id,
  });

  const organizations = await getAccessibleOrganizations(session.user.id);

  return (
    <AppShell
      organizationName={membership.organization.name}
      organizationSlug={membership.organization.slug}
      userName={session.user.name}
      userEmail={session.user.email}
      organizations={organizations.map((organization) => ({
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      }))}
    >
      {children}
    </AppShell>
  );
}
