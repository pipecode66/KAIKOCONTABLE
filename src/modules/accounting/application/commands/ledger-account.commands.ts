"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { archiveLedgerAccount } from "@/modules/accounting/application/use-cases/archive-ledger-account";
import { upsertLedgerAccount } from "@/modules/accounting/application/use-cases/upsert-ledger-account";
import type {
  LedgerAccountActionResult,
  LedgerAccountFormInput,
} from "@/modules/accounting/dto/ledger-account.dto";
import { ledgerAccountFormSchema } from "@/modules/accounting/validators/ledger-account-form.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const MANAGE_PERMISSIONS = ["catalogs.manage", "accounting.manage"];

function buildErrorResult(error: unknown): LedgerAccountActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos del formulario e intenta de nuevo.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof KaikoError) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: false,
    message: "No pudimos completar la operacion. Intenta de nuevo.",
  };
}

export async function saveLedgerAccountAction(
  organizationSlug: string,
  payload: LedgerAccountFormInput,
): Promise<LedgerAccountActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);

    const parsedPayload = ledgerAccountFormSchema.parse(payload);
    const account = await upsertLedgerAccount({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidatePath(`/${organizationSlug}/accounting`);
    revalidatePath(`/${organizationSlug}/accounting/ledger-accounts`);

    return {
      success: true,
      message: parsedPayload.id
        ? "Cuenta actualizada correctamente."
        : "Cuenta creada correctamente.",
      accountId: account.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save ledger account");
    return buildErrorResult(error);
  }
}

export async function archiveLedgerAccountAction(
  organizationSlug: string,
  accountId: string,
): Promise<LedgerAccountActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);

    if (!accountId) {
      throw new DomainError("Debes indicar que cuenta quieres archivar.");
    }

    await archiveLedgerAccount({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      accountId,
      correlationId,
    });

    revalidatePath(`/${organizationSlug}/accounting`);
    revalidatePath(`/${organizationSlug}/accounting/ledger-accounts`);

    return {
      success: true,
      message: "Cuenta archivada correctamente.",
      accountId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to archive ledger account");
    return buildErrorResult(error);
  }
}
