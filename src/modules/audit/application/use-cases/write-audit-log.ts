import { type AuditAction, Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

type AuditDbClient = Prisma.TransactionClient | PrismaClient;

type WriteAuditLogInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  correlationId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
};

function serializeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog(
  input: WriteAuditLogInput,
  db: AuditDbClient = prisma,
) {
  return db.auditLog.create({
    data: {
      organizationId: input.organizationId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      correlationId: input.correlationId ?? null,
      beforeState: serializeJson(input.beforeState),
      afterState: serializeJson(input.afterState),
      metadata: serializeJson(input.metadata),
    },
  });
}
