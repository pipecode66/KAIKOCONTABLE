import { AdminOverviewPage } from "@/modules/admin/ui/pages/admin-overview-page";
import { getAdminSecurityOverview } from "@/modules/admin/application/queries/get-admin-security-overview";

export const dynamic = "force-dynamic";

export default async function AdminRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const overview = await getAdminSecurityOverview(organizationSlug);

  return (
    <AdminOverviewPage
      organizationName={overview.context.membership.organization.name}
      canManageAdmin={overview.canManageAdmin}
      roles={overview.roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        scope: role.organizationId ? "organization" : "system",
        permissionCount: role.rolePermissions.length,
        membershipCount: role._count.memberships,
      }))}
      permissions={overview.permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        module: permission.module,
        action: permission.action,
        scope: permission.organizationId ? "organization" : "system",
      }))}
      memberships={overview.memberships.map((membership) => ({
        id: membership.id,
        userName: membership.user.name ?? "Usuario KAIKO",
        userEmail: membership.user.email,
        roleName: membership.role.name,
        status:
          membership.isActive && membership.status === "ACTIVE"
            ? "active"
            : membership.status === "INVITED"
              ? "pending"
              : "inactive",
      }))}
    />
  );
}
