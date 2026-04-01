import { prisma } from "@/lib/prisma/client";

export async function recordOrganizationAccess(input: {
  membershipId: string;
  accessedAt?: Date;
}) {
  return prisma.membership.update({
    where: {
      id: input.membershipId,
    },
    data: {
      lastAccessedAt: input.accessedAt ?? new Date(),
    },
    select: {
      id: true,
      lastAccessedAt: true,
    },
  });
}
