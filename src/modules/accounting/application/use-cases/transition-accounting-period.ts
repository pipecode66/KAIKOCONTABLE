import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import {
  assertPeriodCanClose,
  assertPeriodCanLock,
  assertPeriodCanReopen,
} from "@/modules/accounting/domain/services/accounting-period.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";

type PeriodTransitionAction = "close" | "reopen" | "lock";

const actionConfig = {
  close: {
    nextStatus: "CLOSED",
    auditAction: "CLOSED_PERIOD",
    eventType: "accounting.period.closed",
  },
  reopen: {
    nextStatus: "OPEN",
    auditAction: "REOPENED_PERIOD",
    eventType: "accounting.period.reopened",
  },
  lock: {
    nextStatus: "LOCKED",
    auditAction: "LOCKED_PERIOD",
    eventType: "accounting.period.locked",
  },
} as const;

type TransitionAccountingPeriodInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  periodId: string;
  action: PeriodTransitionAction;
};

export async function transitionAccountingPeriod(input: TransitionAccountingPeriodInput) {
  return prisma.$transaction(async (tx) => {
    const period = await accountingCoreRepository.findPeriodById(
      {
        organizationId: input.organizationId,
        periodId: input.periodId,
      },
      tx,
    );

    if (!period) {
      throw new NotFoundError("No encontramos el periodo contable.");
    }

    if (input.action === "close") {
      assertPeriodCanClose(period.status);
    } else if (input.action === "lock") {
      assertPeriodCanLock(period.status);
    } else {
      assertPeriodCanReopen(period.status);
    }

    const config = actionConfig[input.action];
    const updatedPeriod = await accountingCoreRepository.updatePeriodStatus(
      {
        periodId: period.id,
        status: config.nextStatus,
        actorUserId: input.actorUserId,
        at: new Date(),
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: config.auditAction,
        entityType: "AccountingPeriod",
        entityId: period.id,
        correlationId: input.correlationId,
        beforeState: {
          status: period.status,
        },
        afterState: {
          status: updatedPeriod.status,
        },
      },
      tx,
    );

    await addOutboxMessage(
      {
        organizationId: input.organizationId,
        eventType: config.eventType,
        aggregateType: "AccountingPeriod",
        aggregateId: period.id,
        correlationId: input.correlationId,
        dedupeKey: `accounting:period:${input.action}:${period.id}:${updatedPeriod.updatedAt.toISOString()}`,
        payload: {
          periodId: period.id,
          fiscalYear: period.fiscalYear,
          periodNumber: period.periodNumber,
          status: updatedPeriod.status,
        },
      },
      tx,
    );

    return updatedPeriod;
  });
}
