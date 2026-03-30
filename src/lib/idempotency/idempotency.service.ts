import { addDays } from "date-fns";

import { prisma } from "@/lib/prisma/client";

type ExecuteOptions<T> = {
  organizationId: string;
  action: string;
  idempotencyKey: string;
  requestHash: string;
  handler: () => Promise<T>;
};

export async function executeIdempotent<T>({
  organizationId,
  action,
  idempotencyKey,
  requestHash,
  handler,
}: ExecuteOptions<T>) {
  const existing = await prisma.idempotencyRecord.findUnique({
    where: {
      organizationId_action_idempotencyKey: {
        organizationId,
        action,
        idempotencyKey,
      },
    },
  });

  if (existing?.status === "COMPLETED" && existing.responseBody) {
    return existing.responseBody as T;
  }

  const result = await handler();

  await prisma.idempotencyRecord.upsert({
    where: {
      organizationId_action_idempotencyKey: {
        organizationId,
        action,
        idempotencyKey,
      },
    },
    update: {
      requestHash,
      status: "COMPLETED",
      responseBody: result as object,
      completedAt: new Date(),
    },
    create: {
      organizationId,
      action,
      idempotencyKey,
      requestHash,
      status: "COMPLETED",
      responseBody: result as object,
      completedAt: new Date(),
      expiresAt: addDays(new Date(), 7),
    },
  });

  return result;
}
