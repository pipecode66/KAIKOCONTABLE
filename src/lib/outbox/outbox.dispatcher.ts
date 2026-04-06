import { enqueueJob } from "@/lib/jobs/job-bus";
import { nextAttemptDate } from "@/lib/jobs/retry-policy";
import { logger } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma/client";
import { translateOutboxMessage } from "@/lib/outbox/outbox.translator";

export async function dispatchPendingOutbox(limit = 25) {
  const messages = await prisma.outboxMessage.findMany({
    where: {
      status: {
        in: ["PENDING", "FAILED"],
      },
      availableAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  let dispatchedCount = 0;

  for (const message of messages) {
    const acquired = await prisma.outboxMessage.updateMany({
      where: {
        id: message.id,
        status: {
          in: ["PENDING", "FAILED"],
        },
      },
      data: {
        status: "DISPATCHING",
        lockedAt: new Date(),
        attempts: {
          increment: 1,
        },
      },
    });

    if (!acquired.count) {
      continue;
    }

    try {
      const target = translateOutboxMessage({
        eventType: message.eventType,
        payload: message.payload as Record<string, unknown>,
        dedupeKey: message.dedupeKey,
      });

      const job =
        target.kind === "job"
          ? await enqueueJob({
              type: target.type,
              payload: target.payload,
              organizationId: message.organizationId ?? undefined,
              correlationId: message.correlationId ?? undefined,
              dedupeKey: target.dedupeKey,
            })
          : null;

      await prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: "DISPATCHED",
          lockedAt: null,
          dispatchedAt: new Date(),
          asyncJobId: job?.id ?? null,
          lastError: null,
        },
      });

      dispatchedCount += 1;
    } catch (error) {
      const isDeadLetter = message.attempts + 1 >= message.maxAttempts;
      await prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: isDeadLetter ? "DEAD_LETTER" : "FAILED",
          lockedAt: null,
          lastError: error instanceof Error ? error.message : "Unknown outbox dispatch error",
          availableAt: isDeadLetter ? message.availableAt : nextAttemptDate(message.attempts + 1),
        },
      });

      logger.error(
        {
          error,
          outboxMessageId: message.id,
          eventType: message.eventType,
        },
        "Failed to dispatch outbox message",
      );
    }
  }

  return dispatchedCount;
}
