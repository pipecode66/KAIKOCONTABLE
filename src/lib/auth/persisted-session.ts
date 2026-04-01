import { addSeconds, subHours } from "date-fns";

import { prisma } from "@/lib/prisma/client";

type PersistedSessionInput = {
  userId: string;
  sessionToken: string;
  maxAgeSeconds: number;
};

export async function createPersistedSession(input: PersistedSessionInput) {
  return prisma.session.create({
    data: {
      sessionToken: input.sessionToken,
      userId: input.userId,
      expires: addSeconds(new Date(), input.maxAgeSeconds),
      lastSeenAt: new Date(),
    },
  });
}

export async function touchPersistedSession(sessionToken: string, maxAgeSeconds: number) {
  const current = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      id: true,
      lastSeenAt: true,
      revokedAt: true,
      expires: true,
    },
  });

  if (!current || current.revokedAt || current.expires <= new Date()) {
    return null;
  }

  if (current.lastSeenAt && current.lastSeenAt > subHours(new Date(), 6)) {
    return current;
  }

  return prisma.session.update({
    where: { sessionToken },
    data: {
      lastSeenAt: new Date(),
      expires: addSeconds(new Date(), maxAgeSeconds),
      revokedAt: null,
    },
  });
}

export async function revokePersistedSession(sessionToken: string) {
  return prisma.session.updateMany({
    where: { sessionToken },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeAllPersistedSessionsForUser(userId: string) {
  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
