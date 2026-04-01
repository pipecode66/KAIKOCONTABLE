import { prisma } from "@/lib/prisma/client";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";
import { getUserOrganizationDirectory } from "@/modules/organizations/application/queries/get-user-organization-directory";

const MANAGE_ORGANIZATIONS_PERMISSIONS = ["organizations.manage", "admin.manage"];

export async function getOrganizationWorkspaceOverview(organizationSlug: string) {
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const canManageOrganizations = hasAnyOrganizationPermission(
    context,
    MANAGE_ORGANIZATIONS_PERMISSIONS,
  );

  const [directory, currencies, memberships] = await Promise.all([
    getUserOrganizationDirectory(context.userId),
    canManageOrganizations
      ? prisma.currency.findMany({
          orderBy: {
            code: "asc",
          },
        })
      : Promise.resolve([]),
    canManageOrganizations
      ? prisma.membership.findMany({
          where: {
            organizationId: context.membership.organizationId,
            isActive: true,
          },
          include: {
            user: true,
            role: true,
          },
          orderBy: [
            {
              createdAt: "asc",
            },
          ],
        })
      : Promise.resolve([]),
  ]);

  return {
    context,
    canManageOrganizations,
    directory,
    currencies,
    memberships,
  };
}
