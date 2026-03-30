import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";

export async function resolveActiveOrganization(userId: string, slug?: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      isActive: true,
      organization: slug ? { slug } : undefined,
    },
    include: {
      organization: {
        include: {
          settings: true,
          baseCurrency: true,
        },
      },
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    throw new NotFoundError("No encontramos una organización activa para este usuario.");
  }

  return membership;
}
