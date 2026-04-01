import { auth } from "@/lib/auth";
import { AuthorizationError } from "@/lib/errors";
import { resolveActiveOrganization } from "@/modules/organizations/application/use-cases/resolve-active-organization";

export type AuthenticatedOrganizationContext = {
  userId: string;
  membership: Awaited<ReturnType<typeof resolveActiveOrganization>>;
  permissionCodes: Set<string>;
};

export async function getAuthenticatedOrganizationContext(
  organizationSlug: string,
): Promise<AuthenticatedOrganizationContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthorizationError("Debes iniciar sesion para continuar.");
  }

  const membership = await resolveActiveOrganization(session.user.id, organizationSlug);
  const permissionCodes = new Set(
    membership.role.rolePermissions.map((item) => item.permission.code),
  );

  return {
    userId: session.user.id,
    membership,
    permissionCodes,
  };
}

export function hasAnyOrganizationPermission(
  context: AuthenticatedOrganizationContext,
  requiredPermissions: string[],
) {
  return requiredPermissions.some((permission) => context.permissionCodes.has(permission));
}

export function assertOrganizationPermission(
  context: AuthenticatedOrganizationContext,
  requiredPermissions: string[],
) {
  if (!hasAnyOrganizationPermission(context, requiredPermissions)) {
    throw new AuthorizationError();
  }
}
