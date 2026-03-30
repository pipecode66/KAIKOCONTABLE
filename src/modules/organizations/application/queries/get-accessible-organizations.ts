import { prisma } from "@/lib/prisma/client";

export async function getAccessibleOrganizations(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      isActive: true,
      status: "ACTIVE",
    },
    include: {
      organization: {
        include: {
          settings: true,
          baseCurrency: true,
        },
      },
      role: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return memberships.map((membership) => membership.organization);
}
