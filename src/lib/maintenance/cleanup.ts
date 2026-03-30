import { subDays, subMonths } from "date-fns";

import { prisma } from "@/lib/prisma/client";
import { maintenancePolicies } from "@/lib/maintenance/policies";

export async function runMaintenanceCleanup() {
  const now = new Date();

  const expiredPasswordResetTokens = await prisma.passwordResetToken.updateMany({
    where: {
      status: "PENDING",
      expiresAt: {
        lt: now,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  const purgedSessions = await prisma.session.deleteMany({
    where: {
      OR: [
        {
          expires: {
            lt: subDays(now, maintenancePolicies.sessionPurgeDays),
          },
        },
        {
          revokedAt: {
            lt: subDays(now, maintenancePolicies.sessionPurgeDays),
          },
        },
      ],
    },
  });

  const archivedIdempotency = await prisma.idempotencyRecord.updateMany({
    where: {
      status: {
        in: ["COMPLETED", "FAILED", "EXPIRED"],
      },
      archivedAt: null,
      createdAt: {
        lt: subDays(now, maintenancePolicies.idempotencyArchiveDays),
      },
    },
    data: {
      status: "ARCHIVED",
      archivedAt: now,
    },
  });

  const archivedAuditLogs = await prisma.auditLog.updateMany({
    where: {
      archivedAt: null,
      createdAt: {
        lt: subMonths(now, maintenancePolicies.auditLogRetentionMonths),
      },
    },
    data: {
      archivedAt: now,
      retentionClass: "ARCHIVAL",
    },
  });

  const purgedTemporaryAttachments = await prisma.attachment.updateMany({
    where: {
      isTemporary: true,
      purgedAt: null,
      createdAt: {
        lt: subDays(now, maintenancePolicies.temporaryAttachmentPurgeDays),
      },
    },
    data: {
      purgedAt: now,
    },
  });

  return {
    expiredPasswordResetTokens: expiredPasswordResetTokens.count,
    purgedSessions: purgedSessions.count,
    archivedIdempotency: archivedIdempotency.count,
    archivedAuditLogs: archivedAuditLogs.count,
    purgedTemporaryAttachments: purgedTemporaryAttachments.count,
  };
}
