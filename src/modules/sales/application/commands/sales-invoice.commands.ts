"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { postSalesInvoice } from "@/modules/sales/application/use-cases/post-sales-invoice";
import { upsertSalesInvoiceDraft } from "@/modules/sales/application/use-cases/upsert-sales-invoice-draft";
import { voidSalesInvoice } from "@/modules/sales/application/use-cases/void-sales-invoice";
import type { SalesActionResult, SalesInvoiceFormInput } from "@/modules/sales/dto/sales.dto";
import {
  salesInvoiceFormSchema,
  salesInvoiceVoidSchema,
  type SalesInvoiceVoidValues,
} from "@/modules/sales/validators/sales-invoice.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const SALES_MANAGE_PERMISSIONS = ["sales.manage"];

function buildErrorResult(error: unknown): SalesActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos enviados e intenta de nuevo.",
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
    message: "No pudimos completar la operacion de ventas.",
  };
}

function revalidateSalesPaths(organizationSlug: string) {
  revalidatePath(`/${organizationSlug}/sales`);
  revalidatePath(`/${organizationSlug}/sales/invoices`);
}

export async function saveSalesInvoiceDraftAction(
  organizationSlug: string,
  payload: SalesInvoiceFormInput,
): Promise<SalesActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, SALES_MANAGE_PERMISSIONS);
    const parsedPayload = salesInvoiceFormSchema.parse(payload);

    const record = await upsertSalesInvoiceDraft({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateSalesPaths(organizationSlug);

    return {
      success: true,
      message: parsedPayload.id ? "Factura actualizada." : "Factura en borrador creada.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save sales invoice draft");
    return buildErrorResult(error);
  }
}

export async function postSalesInvoiceAction(
  organizationSlug: string,
  invoiceId: string,
): Promise<SalesActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, SALES_MANAGE_PERMISSIONS);

    const result = await postSalesInvoice({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      invoiceId,
      idempotencyKey: `sales-invoice-post:${invoiceId}`,
      requestHash: buildIdempotencyRequestHash({ invoiceId }),
    });

    revalidateSalesPaths(organizationSlug);

    return {
      success: true,
      message: `Factura ${result.documentNumber ?? ""} publicada correctamente.`,
      entityId: result.invoiceId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to post sales invoice");
    return buildErrorResult(error);
  }
}

export async function voidSalesInvoiceAction(
  organizationSlug: string,
  payload: SalesInvoiceVoidValues,
): Promise<SalesActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, SALES_MANAGE_PERMISSIONS);
    const parsedPayload = salesInvoiceVoidSchema.parse(payload);

    const result = await voidSalesInvoice({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      invoiceId: parsedPayload.invoiceId,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
    });

    revalidateSalesPaths(organizationSlug);

    return {
      success: true,
      message: "Factura anulada mediante reversion contable.",
      entityId: result.invoiceId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to void sales invoice");
    return buildErrorResult(error);
  }
}
