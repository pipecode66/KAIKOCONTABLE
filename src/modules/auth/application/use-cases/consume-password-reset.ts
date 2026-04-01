import { createHash } from "node:crypto";

import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { hashPassword } from "@/modules/auth/domain/services/password.service";
import {
  findActivePasswordResetTokenByHash,
  markPasswordResetTokenConsumed,
  revokeUserSessions,
  upsertUserCredentialPassword,
} from "@/modules/auth/infrastructure/repositories/user-auth.repository";

function hashResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function consumePasswordReset(rawToken: string, nextPassword: string) {
  const correlationId = createCorrelationId();
  const tokenHash = hashResetToken(rawToken);
  const resetToken = await findActivePasswordResetTokenByHash(tokenHash);

  if (!resetToken?.user || !resetToken.user.isActive) {
    throw new DomainError("El enlace de recuperacion ya no es valido o expiro.");
  }

  const passwordHash = await hashPassword(nextPassword);

  await prisma.$transaction(async (tx) => {
    await upsertUserCredentialPassword(
      {
        userId: resetToken.userId,
        passwordHash,
      },
      tx,
    );

    await markPasswordResetTokenConsumed(resetToken.id, tx);
    await revokeUserSessions(resetToken.userId, tx);

    await writeAuditLog(
      {
        actorUserId: resetToken.userId,
        action: "UPDATED",
        entityType: "UserCredential",
        entityId: resetToken.userId,
        correlationId,
        metadata: {
          reason: "password_reset",
        },
      },
      tx,
    );
  });

  return {
    correlationId,
    userId: resetToken.userId,
  };
}
