import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

type OutboxDbClient = Prisma.TransactionClient | PrismaClient;

type CreateOutboxInput = {
  organizationId?: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  dedupeKey: string;
};

export async function addOutboxMessage(
  input: CreateOutboxInput,
  db: OutboxDbClient = prisma,
) {
  return db.outboxMessage.create({
    data: {
      organizationId: input.organizationId ?? null,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload as Prisma.InputJsonValue,
      correlationId: input.correlationId ?? null,
      dedupeKey: input.dedupeKey,
    },
  });
}
