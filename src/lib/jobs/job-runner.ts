import { addDays } from "date-fns";
import type { AsyncJob } from "@prisma/client";

import { nextAttemptDate } from "@/lib/jobs/retry-policy";
import { logger } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma/client";
import { maintenancePolicies } from "@/lib/maintenance/policies";
import { processReportExport } from "@/modules/reports/application/use-cases/process-report-export";
import { processBankStatementImport } from "@/modules/treasury/application/use-cases/process-bank-statement-import";

const NOOP_JOB_TYPES = new Set([
  "sales.invoice.posted",
  "purchases.bill.posted",
  "treasury.payment.posted",
  "treasury.payment.voided",
  "treasury.transfer.posted",
  "treasury.transfer.voided",
  "accounting.voucher.posted",
  "accounting.journal.reversed",
  "accounting.period.closed",
  "accounting.period.reopened",
  "accounting.period.locked",
  "sales.document.reversed",
  "purchases.document.reversed",
  "treasury.document.reversed",
]);

async function runJob(job: AsyncJob) {
  if (NOOP_JOB_TYPES.has(job.type)) {
    return;
  }

  const payload = job.payload as Record<string, unknown>;
  switch (job.type) {
    case "treasury.statement_import.process": {
      if (!job.organizationId) {
        throw new Error("Statement import job requires organizationId");
      }

      await processBankStatementImport({
        organizationId: job.organizationId,
        correlationId: job.correlationId ?? undefined,
        importId: String(payload.importId ?? ""),
        csvContent: String(payload.csvContent ?? ""),
      });
      return;
    }
    case "reports.export": {
      if (!job.organizationId) {
        throw new Error("Report export job requires organizationId");
      }

      await processReportExport({
        jobId: job.id,
        organizationId: job.organizationId,
        correlationId: job.correlationId ?? undefined,
        payload,
      });
      return;
    }
    default:
      throw new Error(`Unsupported async job type: ${job.type}`);
  }
}

async function acquireJob(jobId: string) {
  const now = new Date();
  const acquired = await prisma.asyncJob.updateMany({
    where: {
      id: jobId,
      status: {
        in: ["PENDING", "RETRYING"],
      },
      availableAt: {
        lte: now,
      },
    },
    data: {
      status: "RUNNING",
      lockedAt: now,
      attempts: {
        increment: 1,
      },
    },
  });

  if (!acquired.count) {
    return null;
  }

  return prisma.asyncJob.findUnique({
    where: {
      id: jobId,
    },
  });
}

export async function processPendingJobs(limit = 25) {
  const queuedJobs = await prisma.asyncJob.findMany({
    where: {
      status: {
        in: ["PENDING", "RETRYING"],
      },
      availableAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    select: {
      id: true,
    },
  });

  let processedCount = 0;

  for (const queuedJob of queuedJobs) {
    const job = await acquireJob(queuedJob.id);
    if (!job) {
      continue;
    }

    try {
      await runJob(job);

      await prisma.asyncJob.update({
        where: { id: job.id },
        data: {
          status: "SUCCEEDED",
          lockedAt: null,
          terminalAt: new Date(),
          archivedAt: addDays(new Date(), maintenancePolicies.asyncJobRetentionDays),
          lastError: null,
        },
      });

      processedCount += 1;
    } catch (error) {
      const shouldDeadLetter = job.attempts >= job.maxAttempts;
      await prisma.asyncJob.update({
        where: { id: job.id },
        data: {
          status: shouldDeadLetter ? "DEAD_LETTER" : "RETRYING",
          lockedAt: null,
          terminalAt: shouldDeadLetter ? new Date() : null,
          lastError: error instanceof Error ? error.message : "Unknown async job error",
          availableAt: shouldDeadLetter ? job.availableAt : nextAttemptDate(job.attempts),
        },
      });

      logger.error(
        {
          error,
          jobId: job.id,
          jobType: job.type,
        },
        "Failed to process async job",
      );
    }
  }

  return processedCount;
}
