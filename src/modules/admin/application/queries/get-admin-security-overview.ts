import { prisma } from "@/lib/prisma/client";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const MANAGE_ADMIN_PERMISSIONS = ["admin.manage", "organizations.manage"];

export async function getAdminSecurityOverview(organizationSlug: string) {
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const canManageAdmin = hasAnyOrganizationPermission(context, MANAGE_ADMIN_PERMISSIONS);

  if (!canManageAdmin) {
    return {
      context,
      canManageAdmin,
      roles: [],
      permissions: [],
      memberships: [],
    };
  }

  const [roles, permissions, memberships] = await Promise.all([
    prisma.role.findMany({
      where: {
        OR: [
          {
            organizationId: null,
          },
          {
            organizationId: context.membership.organizationId,
          },
        ],
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: [
        {
          isSystem: "desc",
        },
        {
          key: "asc",
        },
      ],
    }),
    prisma.permission.findMany({
      where: {
        OR: [
          {
            organizationId: null,
          },
          {
            organizationId: context.membership.organizationId,
          },
        ],
      },
      orderBy: [
        {
          module: "asc",
        },
        {
          action: "asc",
        },
      ],
    }),
    prisma.membership.findMany({
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
    }),
  ]);

  return {
    context,
    canManageAdmin,
    roles,
    permissions,
    memberships,
  };
}
