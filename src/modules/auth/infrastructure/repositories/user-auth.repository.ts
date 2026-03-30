import { prisma } from "@/lib/prisma/client";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      credential: true,
      memberships: {
        include: {
          organization: true,
          role: true,
        },
      },
    },
  });
}
