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

  const purgedPasswordResetTokens = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        {
          consumedAt: {
            lt: subDays(now, maintenancePolicies.passwordResetTokenPurgeDays),
          },
        },
        {
          expiresAt: {
            lt: subDays(now, maintenancePolicies.passwordResetTokenPurgeDays),
          },
        },
      ],
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

  const expiredIdempotency = await prisma.idempotencyRecord.updateMany({
    where: {
      status: "IN_PROGRESS",
      expiresAt: {
        lt: now,
      },
    },
    data: {
      status: "EXPIRED",
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

  const purgedIdempotency = await prisma.idempotencyRecord.deleteMany({
    where: {
      status: "ARCHIVED",
      archivedAt: {
        lt: subDays(now, maintenancePolicies.idempotencyPurgeDays),
      },
    },
  });

  const archivedAsyncJobs = await prisma.asyncJob.updateMany({
    where: {
      status: {
        in: ["SUCCEEDED", "FAILED", "DEAD_LETTER", "CANCELLED"],
      },
      archivedAt: null,
      terminalAt: {
        lt: subDays(now, maintenancePolicies.asyncJobRetentionDays),
      },
    },
    data: {
      status: "ARCHIVED",
      archivedAt: now,
      lockedAt: null,
    },
  });

  const archivedOutboxMessages = await prisma.outboxMessage.updateMany({
    where: {
      status: {
        in: ["DISPATCHED", "DEAD_LETTER"],
      },
      createdAt: {
        lt: subDays(now, maintenancePolicies.asyncJobRetentionDays),
      },
    },
    data: {
      status: "ARCHIVED",
      lockedAt: null,
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
    purgedPasswordResetTokens: purgedPasswordResetTokens.count,
    purgedSessions: purgedSessions.count,
    expiredIdempotency: expiredIdempotency.count,
    archivedIdempotency: archivedIdempotency.count,
    purgedIdempotency: purgedIdempotency.count,
    archivedAsyncJobs: archivedAsyncJobs.count,
    archivedOutboxMessages: archivedOutboxMessages.count,
    archivedAuditLogs: archivedAuditLogs.count,
    purgedTemporaryAttachments: purgedTemporaryAttachments.count,
  };
}
