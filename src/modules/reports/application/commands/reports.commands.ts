"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import type { ReportsActionResult } from "@/modules/reports/dto/reports.dto";
import { requestReportExport } from "@/modules/reports/application/use-cases/request-report-export";
import {
  reportExportRequestSchema,
  type ReportExportRequestValues,
} from "@/modules/reports/validators/reports.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

function buildErrorResult(error: unknown): ReportsActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los filtros y vuelve a intentar.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof KaikoError || error instanceof DomainError) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: false,
    message: "No pudimos crear la exportacion del reporte.",
  };
}

export async function requestReportExportAction(
  organizationSlug: string,
  payload: ReportExportRequestValues,
): Promise<ReportsActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, ["reports.read"]);
    const parsedPayload = reportExportRequestSchema.parse(payload);

    const result = await requestReportExport({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidatePath(`/${organizationSlug}/reports`);
    revalidatePath(`/${organizationSlug}/reports/exports`);

    return {
      success: true,
      message: "Exportacion encolada para procesamiento.",
      entityId: result.exportId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to request report export");
    return buildErrorResult(error);
  }
}
