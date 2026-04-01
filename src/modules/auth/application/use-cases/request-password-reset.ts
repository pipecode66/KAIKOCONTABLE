import { addHours } from "date-fns";
import { createHash, randomBytes } from "node:crypto";

import { sendMail } from "@/lib/mail/mailer";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { logger } from "@/lib/observability/logger";
import { getRawEnv } from "@/lib/env/server";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import {
  createPasswordResetToken,
  expirePendingPasswordResetTokens,
  findUserByEmail,
} from "@/modules/auth/infrastructure/repositories/user-auth.repository";
import { prisma } from "@/lib/prisma/client";

const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;

function hashResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function buildPasswordResetUrl(rawToken: string) {
  const env = getRawEnv();
  const baseUrl = env.APP_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export async function requestPasswordReset(email: string) {
  const correlationId = createCorrelationId();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user?.isActive) {
    logger.info({ email: normalizedEmail, correlationId }, "Password reset requested for unknown user");
    return {
      correlationId,
      debugResetUrl: undefined,
    };
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = addHours(new Date(), PASSWORD_RESET_TOKEN_TTL_HOURS);
  const resetUrl = buildPasswordResetUrl(rawToken);

  await prisma.$transaction(async (tx) => {
    await expirePendingPasswordResetTokens(user.id, tx);
    await createPasswordResetToken(
      {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
      tx,
    );

    await writeAuditLog(
      {
        actorUserId: user.id,
        action: "CREATED",
        entityType: "PasswordResetToken",
        correlationId,
        metadata: {
          email: normalizedEmail,
          expiresAt: expiresAt.toISOString(),
        },
      },
      tx,
    );
  });

  await sendMail({
    to: normalizedEmail,
    subject: "Recupera tu acceso a KAIKO",
    html: `
      <p>Hola${user.name ? `, ${user.name}` : ""}.</p>
      <p>Usa este enlace para restablecer tu acceso a KAIKO:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este enlace expirara en 60 minutos.</p>
    `,
  });

  logger.info(
    {
      email: normalizedEmail,
      correlationId,
      resetUrl,
    },
    "Password reset requested",
  );

  return {
    correlationId,
    debugResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
  };
}
