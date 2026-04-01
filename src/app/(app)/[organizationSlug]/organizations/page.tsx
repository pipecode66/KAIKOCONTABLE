import { OrganizationsOverviewPage } from "@/modules/organizations/ui/pages/organizations-overview-page";
import { getOrganizationWorkspaceOverview } from "@/modules/organizations/application/queries/get-organization-workspace-overview";

export const dynamic = "force-dynamic";

function formatLastAccessedAt(value: Date | null | undefined) {
  if (!value) {
    return "Sin actividad";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function OrganizationsRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const overview = await getOrganizationWorkspaceOverview(organizationSlug);

  return (
    <OrganizationsOverviewPage
      activeOrganizationSlug={organizationSlug}
      organizationName={overview.context.membership.organization.name}
      canManageOrganizations={overview.canManageOrganizations}
      organizations={overview.directory.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        roleName: membership.role.name,
        locale: membership.organization.settings?.locale ?? "es-CO",
        timezone: membership.organization.settings?.timezone ?? "America/Bogota",
        currencyCode: membership.organization.baseCurrency?.code ?? "COP",
        lastAccessedAt: formatLastAccessedAt(membership.lastAccessedAt),
        isActive: membership.organization.slug === organizationSlug,
      }))}
      memberships={overview.memberships.map((membership) => ({
        id: membership.id,
        name: membership.user.name ?? "Usuario KAIKO",
        email: membership.user.email,
        roleName: membership.role.name,
        status:
          membership.isActive && membership.status === "ACTIVE"
            ? "active"
            : membership.status === "INVITED"
              ? "pending"
              : "inactive",
        lastAccessedAt: formatLastAccessedAt(membership.lastAccessedAt),
      }))}
      currencies={overview.currencies.map((currency) => ({
        id: currency.id,
        code: currency.code,
        name: currency.name,
      }))}
      defaultSettings={{
        timezone: overview.context.membership.organization.settings?.timezone ?? "America/Bogota",
        locale: overview.context.membership.organization.settings?.locale ?? "es-CO",
        fiscalYearStartMonth:
          overview.context.membership.organization.settings?.fiscalYearStartMonth ?? 1,
        numberFormat:
          overview.context.membership.organization.settings?.numberFormat ?? "es-CO-currency",
        dateFormat:
          overview.context.membership.organization.settings?.dateFormat ?? "dd/MM/yyyy",
      }}
    />
  );
}
