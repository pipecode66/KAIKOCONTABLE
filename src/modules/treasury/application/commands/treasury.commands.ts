"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { DomainError, KaikoError } from "@/lib/errors";
import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { completeReconciliation } from "@/modules/treasury/application/use-cases/complete-reconciliation";
import { createReconciliation } from "@/modules/treasury/application/use-cases/create-reconciliation";
import { postPayment } from "@/modules/treasury/application/use-cases/post-payment";
import { postTransfer } from "@/modules/treasury/application/use-cases/post-transfer";
import { requestBankStatementImport } from "@/modules/treasury/application/use-cases/request-bank-statement-import";
import { upsertPaymentDraft } from "@/modules/treasury/application/use-cases/upsert-payment-draft";
import { upsertTransferDraft } from "@/modules/treasury/application/use-cases/upsert-transfer-draft";
import { voidPayment } from "@/modules/treasury/application/use-cases/void-payment";
import { voidTransfer } from "@/modules/treasury/application/use-cases/void-transfer";
import type {
  PaymentFormInput,
  ReconciliationCompleteInput,
  ReconciliationCreateInput,
  TransferFormInput,
  TreasuryActionResult,
} from "@/modules/treasury/dto/treasury.dto";
import {
  paymentFormSchema,
  reconciliationCompleteSchema,
  reconciliationCreateSchema,
  statementImportSchema,
  transferFormSchema,
  treasuryVoidSchema,
} from "@/modules/treasury/validators/treasury-operations.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const TREASURY_MANAGE_PERMISSIONS = ["treasury.manage"];

function buildErrorResult(error: unknown): TreasuryActionResult {
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
    message: "No pudimos completar la operacion de tesoreria.",
  };
}

function revalidateTreasuryPaths(organizationSlug: string) {
  revalidatePath(`/${organizationSlug}/treasury`);
  revalidatePath(`/${organizationSlug}/treasury/payments`);
  revalidatePath(`/${organizationSlug}/treasury/transfers`);
  revalidatePath(`/${organizationSlug}/treasury/imports`);
  revalidatePath(`/${organizationSlug}/treasury/reconciliations`);
  revalidatePath(`/${organizationSlug}/treasury/cash-state`);
}

export async function savePaymentDraftAction(
  organizationSlug: string,
  payload: PaymentFormInput,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = paymentFormSchema.parse(payload);

    const record = await upsertPaymentDraft({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: parsedPayload.id ? "Pago actualizado." : "Pago en borrador creado.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save payment draft");
    return buildErrorResult(error);
  }
}

export async function postPaymentAction(
  organizationSlug: string,
  paymentId: string,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);

    const result = await postPayment({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      paymentId,
      idempotencyKey: `payment-post:${paymentId}`,
      requestHash: buildIdempotencyRequestHash({ paymentId }),
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: `Pago ${result.reference ?? ""} publicado correctamente.`,
      entityId: result.paymentId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to post payment");
    return buildErrorResult(error);
  }
}

export async function voidPaymentAction(
  organizationSlug: string,
  payload: { id: string; reason: string; idempotencyKey: string },
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = treasuryVoidSchema.parse(payload);

    const result = await voidPayment({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      paymentId: parsedPayload.id,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: "Pago anulado mediante reversion contable.",
      entityId: result.paymentId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to void payment");
    return buildErrorResult(error);
  }
}

export async function saveTransferDraftAction(
  organizationSlug: string,
  payload: TransferFormInput,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = transferFormSchema.parse(payload);

    const record = await upsertTransferDraft({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: parsedPayload.id ? "Traslado actualizado." : "Traslado en borrador creado.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save transfer draft");
    return buildErrorResult(error);
  }
}

export async function postTransferAction(
  organizationSlug: string,
  transferId: string,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);

    const result = await postTransfer({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      transferId,
      idempotencyKey: `transfer-post:${transferId}`,
      requestHash: buildIdempotencyRequestHash({ transferId }),
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: `Traslado ${result.reference ?? ""} publicado correctamente.`,
      entityId: result.transferId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to post transfer");
    return buildErrorResult(error);
  }
}

export async function voidTransferAction(
  organizationSlug: string,
  payload: { id: string; reason: string; idempotencyKey: string },
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = treasuryVoidSchema.parse(payload);

    const result = await voidTransfer({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      transferId: parsedPayload.id,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: "Traslado anulado mediante reversion contable.",
      entityId: result.transferId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to void transfer");
    return buildErrorResult(error);
  }
}

export async function requestStatementImportAction(
  organizationSlug: string,
  payload: { bankAccountId: string; fileName: string; csvContent: string },
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = statementImportSchema.parse(payload);

    const record = await requestBankStatementImport({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: "Extracto cargado y enviado a procesamiento.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to request statement import");
    return buildErrorResult(error);
  }
}

export async function createReconciliationAction(
  organizationSlug: string,
  payload: ReconciliationCreateInput,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = reconciliationCreateSchema.parse(payload);

    const record = await createReconciliation({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: "Conciliacion creada.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to create reconciliation");
    return buildErrorResult(error);
  }
}

export async function completeReconciliationAction(
  organizationSlug: string,
  payload: ReconciliationCompleteInput,
): Promise<TreasuryActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, TREASURY_MANAGE_PERMISSIONS);
    const parsedPayload = reconciliationCompleteSchema.parse(payload);

    const record = await completeReconciliation({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateTreasuryPaths(organizationSlug);

    return {
      success: true,
      message: "Conciliacion completada.",
      entityId: record.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to complete reconciliation");
    return buildErrorResult(error);
  }
}
