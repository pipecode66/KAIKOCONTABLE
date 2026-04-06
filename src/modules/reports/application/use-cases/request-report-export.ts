import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma/client";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { ReportExportRequestValues } from "@/modules/reports/validators/reports.validator";

type RequestReportExportInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: ReportExportRequestValues;
};

export async function requestReportExport(input: RequestReportExportInput) {
  const exportId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await addOutboxMessage(
      {
        organizationId: input.organizationId,
        eventType: "reports.export",
        aggregateType: "ReportExport",
        aggregateId: exportId,
        correlationId: input.correlationId,
        dedupeKey: `reports:export:${input.organizationId}:${exportId}`,
        payload: {
          exportId,
          reportKey: input.data.reportKey,
          asOf: input.data.asOf ?? null,
          from: input.data.from ?? null,
          to: input.data.to ?? null,
          requestedBy: input.actorUserId,
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "CREATED",
        entityType: "ReportExport",
        entityId: exportId,
        correlationId: input.correlationId,
        afterState: {
          reportKey: input.data.reportKey,
          asOf: input.data.asOf ?? null,
          from: input.data.from ?? null,
          to: input.data.to ?? null,
        },
      },
      tx,
    );
  });

  return {
    exportId,
  };
}
