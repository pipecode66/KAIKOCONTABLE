import { PasswordResetStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

type AuthDbClient = Prisma.TransactionClient | typeof prisma;

export async function findUserByEmail(email: string, db: AuthDbClient = prisma) {
  return db.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    include: {
      credential: true,
      memberships: {
        include: {
          organization: true,
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
      },
    },
  });
}

export async function expirePendingPasswordResetTokens(
  userId: string,
  db: AuthDbClient = prisma,
) {
  return db.passwordResetToken.updateMany({
    where: {
      userId,
      status: PasswordResetStatus.PENDING,
    },
    data: {
      status: PasswordResetStatus.EXPIRED,
    },
  });
}

export async function createPasswordResetToken(
  input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  },
  db: AuthDbClient = prisma,
) {
  return db.passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findActivePasswordResetTokenByHash(
  tokenHash: string,
  db: AuthDbClient = prisma,
) {
  return db.passwordResetToken.findFirst({
    where: {
      tokenHash,
      status: PasswordResetStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          credential: true,
        },
      },
    },
  });
}

export async function markPasswordResetTokenConsumed(
  id: string,
  db: AuthDbClient = prisma,
) {
  return db.passwordResetToken.update({
    where: { id },
    data: {
      status: PasswordResetStatus.CONSUMED,
      consumedAt: new Date(),
    },
  });
}

export async function upsertUserCredentialPassword(
  input: {
    userId: string;
    passwordHash: string;
  },
  db: AuthDbClient = prisma,
) {
  return db.userCredential.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      passwordHash: input.passwordHash,
      passwordChangedAt: new Date(),
    },
    create: {
      userId: input.userId,
      passwordHash: input.passwordHash,
      passwordChangedAt: new Date(),
    },
  });
}

export async function revokeUserSessions(userId: string, db: AuthDbClient = prisma) {
  return db.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
