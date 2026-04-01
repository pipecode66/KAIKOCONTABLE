import { createHash } from "node:crypto";

import { addDays } from "date-fns";
import { Prisma, type IdempotencyRecord } from "@prisma/client";

import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";

type ExecuteOptions<T> = {
  organizationId: string;
  action: string;
  idempotencyKey: string;
  requestHash: string;
  resourceType?: string;
  resourceId?: string;
  ttlDays?: number;
  handler: () => Promise<T>;
};

type IdempotencyResolution =
  | { type: "replay"; payload: unknown }
  | { type: "conflict"; message: string }
  | { type: "acquire" };

export function buildIdempotencyRequestHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function resolveIdempotencyState(
  existing: Pick<IdempotencyRecord, "status" | "requestHash" | "responseBody" | "expiresAt"> | null,
  requestHash: string,
  now = new Date(),
): IdempotencyResolution {
  if (!existing) {
    return { type: "acquire" };
  }

  if (existing.requestHash !== requestHash) {
    return {
      type: "conflict",
      message: "La misma llave de idempotencia ya fue usada para otra operacion.",
    };
  }

  if (existing.status === "COMPLETED" && existing.responseBody) {
    return {
      type: "replay",
      payload: existing.responseBody,
    };
  }

  if (existing.status === "IN_PROGRESS" && existing.expiresAt > now) {
    return {
      type: "conflict",
      message: "La operacion ya esta en curso. Espera el resultado antes de reintentar.",
    };
  }

  return { type: "acquire" };
}

export async function executeIdempotent<T>({
  organizationId,
  action,
  idempotencyKey,
  requestHash,
  resourceType,
  resourceId,
  ttlDays = 7,
  handler,
}: ExecuteOptions<T>) {
  const now = new Date();
  const expiresAt = addDays(now, ttlDays);

  const existing = await prisma.idempotencyRecord.findUnique({
    where: {
      organizationId_action_idempotencyKey: {
        organizationId,
        action,
        idempotencyKey,
      },
    },
  });

  const resolution = resolveIdempotencyState(existing, requestHash, now);

  if (resolution.type === "replay") {
    return resolution.payload as T;
  }

  if (resolution.type === "conflict") {
    throw new DomainError(resolution.message, "IDEMPOTENCY_CONFLICT");
  }

  const claimPayload = {
    organizationId,
    action,
    idempotencyKey,
    requestHash,
    resourceType: resourceType ?? null,
    resourceId: resourceId ?? null,
    status: "IN_PROGRESS" as const,
    lockedAt: now,
    expiresAt,
    archivedAt: null,
    completedAt: null,
    responseCode: null,
    responseBody: Prisma.JsonNull,
  };

  try {
    if (existing) {
      await prisma.idempotencyRecord.update({
        where: { id: existing.id },
        data: claimPayload,
      });
    } else {
      await prisma.idempotencyRecord.create({
        data: claimPayload,
      });
    }
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

    if (!duplicate) {
      throw error;
    }

    const latest = await prisma.idempotencyRecord.findUnique({
      where: {
        organizationId_action_idempotencyKey: {
          organizationId,
          action,
          idempotencyKey,
        },
      },
    });

    const latestResolution = resolveIdempotencyState(latest, requestHash, now);

    if (latestResolution.type === "replay") {
      return latestResolution.payload as T;
    }

    if (latestResolution.type === "conflict") {
      throw new DomainError(latestResolution.message, "IDEMPOTENCY_CONFLICT");
    }
  }

  try {
    const result = await handler();

    await prisma.idempotencyRecord.update({
      where: {
        organizationId_action_idempotencyKey: {
          organizationId,
          action,
          idempotencyKey,
        },
      },
      data: {
        resourceType: resourceType ?? undefined,
        resourceId: resourceId ?? undefined,
        status: "COMPLETED",
        responseCode: 200,
        responseBody: result as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    await prisma.idempotencyRecord.update({
      where: {
        organizationId_action_idempotencyKey: {
          organizationId,
          action,
          idempotencyKey,
        },
      },
      data: {
        resourceType: resourceType ?? undefined,
        resourceId: resourceId ?? undefined,
        status: "FAILED",
        responseCode: error instanceof DomainError ? error.statusCode : 500,
      },
    });

    throw error;
  }
}
