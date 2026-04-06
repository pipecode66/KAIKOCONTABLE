import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { computeBackoffDelay } from "@/lib/jobs/backoff";
import type { EnqueueJobInput } from "@/lib/jobs/types";

export async function enqueueJob(input: EnqueueJobInput) {
  if (!input.dedupeKey) {
    return prisma.asyncJob.create({
      data: {
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
        organizationId: input.organizationId ?? null,
        correlationId: input.correlationId ?? null,
      },
    });
  }

  return prisma.asyncJob.upsert({
    where: {
      dedupeKey: input.dedupeKey,
    },
    update: {
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
      status: "PENDING",
      availableAt: new Date(Date.now() + computeBackoffDelay(0)),
      lockedAt: null,
      terminalAt: null,
      archivedAt: null,
      lastError: null,
      correlationId: input.correlationId ?? null,
      organizationId: input.organizationId ?? null,
    },
    create: {
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
      organizationId: input.organizationId ?? null,
      correlationId: input.correlationId ?? null,
      dedupeKey: input.dedupeKey,
    },
  });
}
