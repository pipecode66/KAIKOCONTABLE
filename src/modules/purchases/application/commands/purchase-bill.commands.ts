"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { postPurchaseBill } from "@/modules/purchases/application/use-cases/post-purchase-bill";
import { upsertPurchaseBillDraft } from "@/modules/purchases/application/use-cases/upsert-purchase-bill-draft";
import { voidPurchaseBill } from "@/modules/purchases/application/use-cases/void-purchase-bill";
import type {
  PurchaseBillActionResult,
  PurchaseBillFormInput,
} from "@/modules/purchases/dto/purchase-bill.dto";
import {
  purchaseBillFormSchema,
  purchaseBillVoidSchema,
  type PurchaseBillVoidValues,
} from "@/modules/purchases/validators/purchase-bill.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const PURCHASES_MANAGE_PERMISSIONS = ["purchases.manage"];

function buildErrorResult(error: unknown): PurchaseBillActionResult {
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
    message: "No pudimos completar la operacion de compras.",
  };
}

function revalidatePurchasesPaths(organizationSlug: string) {
  revalidatePath(`/${organizationSlug}/purchases`);
  revalidatePath(`/${organizationSlug}/purchases/bills`);
}

export async function savePurchaseBillDraftAction(
  organizationSlug: string,
  payload: PurchaseBillFormInput,
): Promise<PurchaseBillActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, PURCHASES_MANAGE_PERMISSIONS);
    const parsedPayload = purchaseBillFormSchema.parse(payload);

    const record = await upsertPurchaseBillDraft({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidatePurchasesPaths(organizationSlug);

    return {
      success: true,
      message: parsedPayload.id ? "Factura actualizada." : "Factura en borrador creada.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save purchase bill draft");
    return buildErrorResult(error);
  }
}

export async function postPurchaseBillAction(
  organizationSlug: string,
  billId: string,
): Promise<PurchaseBillActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, PURCHASES_MANAGE_PERMISSIONS);

    const result = await postPurchaseBill({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      billId,
      idempotencyKey: `purchase-bill-post:${billId}`,
      requestHash: buildIdempotencyRequestHash({ billId }),
    });

    revalidatePurchasesPaths(organizationSlug);

    return {
      success: true,
      message: `Factura ${result.documentNumber ?? ""} publicada correctamente.`,
      entityId: result.billId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to post purchase bill");
    return buildErrorResult(error);
  }
}

export async function voidPurchaseBillAction(
  organizationSlug: string,
  payload: PurchaseBillVoidValues,
): Promise<PurchaseBillActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, PURCHASES_MANAGE_PERMISSIONS);
    const parsedPayload = purchaseBillVoidSchema.parse(payload);

    const result = await voidPurchaseBill({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      billId: parsedPayload.billId,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
    });

    revalidatePurchasesPaths(organizationSlug);

    return {
      success: true,
      message: "Factura anulada mediante reversion contable.",
      entityId: result.billId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to void purchase bill");
    return buildErrorResult(error);
  }
}
