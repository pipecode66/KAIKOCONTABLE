import { prisma } from "@/lib/prisma/client";

export async function getDefaultOrganizationSlug(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      isActive: true,
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return membership?.organization.slug ?? null;
}
