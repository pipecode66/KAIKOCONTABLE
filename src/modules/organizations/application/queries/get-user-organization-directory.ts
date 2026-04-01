import { prisma } from "@/lib/prisma/client";

export async function getUserOrganizationDirectory(userId: string) {
  return prisma.membership.findMany({
    where: {
      userId,
      isActive: true,
      status: "ACTIVE",
    },
    include: {
      role: true,
      organization: {
        include: {
          settings: true,
          baseCurrency: true,
        },
      },
    },
    orderBy: [
      {
        lastAccessedAt: {
          sort: "desc",
          nulls: "last",
        },
      },
      {
        createdAt: "asc",
      },
    ],
  });
}
