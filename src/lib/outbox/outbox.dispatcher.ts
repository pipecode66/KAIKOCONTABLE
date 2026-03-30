import { enqueueJob } from "@/lib/jobs/job-bus";
import { prisma } from "@/lib/prisma/client";

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

  for (const message of messages) {
    const job = await enqueueJob({
      type: message.eventType,
      payload: message.payload as Record<string, unknown>,
      organizationId: message.organizationId ?? undefined,
      correlationId: message.correlationId ?? undefined,
      dedupeKey: `outbox:${message.dedupeKey}`,
    });

    await prisma.outboxMessage.update({
      where: { id: message.id },
      data: {
        status: "DISPATCHED",
        dispatchedAt: new Date(),
        asyncJobId: job.id,
      },
    });
  }

  return messages.length;
}
