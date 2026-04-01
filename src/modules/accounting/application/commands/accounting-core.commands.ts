"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import type { AccountingActionResult, ManualVoucherFormInput } from "@/modules/accounting/dto/accounting-core.dto";
import { postAccountingVoucher } from "@/modules/accounting/application/use-cases/post-accounting-voucher";
import { reverseJournalEntry } from "@/modules/accounting/application/use-cases/reverse-journal-entry";
import { transitionAccountingPeriod } from "@/modules/accounting/application/use-cases/transition-accounting-period";
import { upsertManualVoucherDraft } from "@/modules/accounting/application/use-cases/upsert-manual-voucher-draft";
import { voidAccountingVoucher } from "@/modules/accounting/application/use-cases/void-accounting-voucher";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import {
  accountingPeriodActionSchema,
  type AccountingPeriodActionInput,
} from "@/modules/accounting/validators/accounting-period-action.validator";
import {
  manualVoucherFormSchema,
  voucherVoidSchema,
  type VoucherVoidValues,
} from "@/modules/accounting/validators/manual-voucher-form.validator";
import {
  journalReversalSchema,
  type JournalReversalInput,
} from "@/modules/accounting/validators/journal-reversal.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const ACCOUNTING_MANAGE_PERMISSIONS = ["accounting.manage"];
const PERIOD_CLOSE_PERMISSIONS = ["accounting.manage", "accounting.period.close"];
const PERIOD_REOPEN_PERMISSIONS = ["accounting.manage", "accounting.period.reopen"];
const PERIOD_LOCK_PERMISSIONS = ["accounting.manage", "accounting.period.lock"];

function buildErrorResult(error: unknown): AccountingActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos enviados e intenta de nuevo.",
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
    message: "No pudimos completar la operacion contable. Intenta de nuevo.",
  };
}

function revalidateAccountingPaths(organizationSlug: string) {
  revalidatePath(`/${organizationSlug}/accounting`);
  revalidatePath(`/${organizationSlug}/accounting/periods`);
  revalidatePath(`/${organizationSlug}/accounting/vouchers`);
  revalidatePath(`/${organizationSlug}/accounting/journal`);
  revalidatePath(`/${organizationSlug}/accounting/ledger-accounts`);
}

function buildVoucherPermissions(voucherType: ManualVoucherFormInput["voucherType"]) {
  if (voucherType === "OPENING_BALANCE") {
    return [...ACCOUNTING_MANAGE_PERMISSIONS, "accounting.opening_balance.post"];
  }

  if (voucherType === "PERIOD_CLOSING") {
    return [...ACCOUNTING_MANAGE_PERMISSIONS, "accounting.period.close"];
  }

  return [...ACCOUNTING_MANAGE_PERMISSIONS, "accounting.manual_journal.post"];
}

export async function saveManualVoucherDraftAction(
  organizationSlug: string,
  payload: ManualVoucherFormInput,
): Promise<AccountingActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    const parsedPayload = manualVoucherFormSchema.parse(payload);
    assertOrganizationPermission(context, buildVoucherPermissions(parsedPayload.voucherType));

    const voucher = await upsertManualVoucherDraft({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      data: parsedPayload,
    });

    revalidateAccountingPaths(organizationSlug);

    return {
      success: true,
      message: parsedPayload.id
        ? "Voucher actualizado correctamente."
        : "Voucher creado correctamente.",
      entityId: voucher.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to save manual voucher draft");
    return buildErrorResult(error);
  }
}

export async function postAccountingVoucherAction(
  organizationSlug: string,
  voucherId: string,
): Promise<AccountingActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    const voucher = await accountingCoreRepository.findVoucherById({
      organizationId: context.membership.organizationId,
      voucherId,
    });

    if (!voucher) {
      throw new DomainError("No encontramos el voucher a postear.");
    }

    assertOrganizationPermission(context, buildVoucherPermissions(voucher.voucherType));

    const result = await postAccountingVoucher({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      voucherId,
      idempotencyKey: `voucher-post:${voucherId}`,
      requestHash: buildIdempotencyRequestHash({
        voucherId,
        version: voucher.version,
        status: voucher.status,
      }),
    });

    revalidateAccountingPaths(organizationSlug);

    return {
      success: true,
      message: `Voucher ${result.voucherNumber ?? ""} posteado correctamente.`,
      entityId: result.voucherId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to post accounting voucher");
    return buildErrorResult(error);
  }
}

export async function voidAccountingVoucherAction(
  organizationSlug: string,
  payload: VoucherVoidValues,
): Promise<AccountingActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, ACCOUNTING_MANAGE_PERMISSIONS);

    const parsedPayload = voucherVoidSchema.parse(payload);
    await voidAccountingVoucher({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      voucherId: parsedPayload.voucherId,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
    });

    revalidateAccountingPaths(organizationSlug);

    return {
      success: true,
      message: "Voucher anulado mediante reversion contable.",
      entityId: parsedPayload.voucherId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to void accounting voucher");
    return buildErrorResult(error);
  }
}

export async function reverseJournalEntryAction(
  organizationSlug: string,
  payload: JournalReversalInput,
): Promise<AccountingActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, ACCOUNTING_MANAGE_PERMISSIONS);

    const parsedPayload = journalReversalSchema.parse(payload);
    const result = await reverseJournalEntry({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      journalEntryId: parsedPayload.journalEntryId,
      reason: parsedPayload.reason,
      idempotencyKey: parsedPayload.idempotencyKey,
      requestHash: buildIdempotencyRequestHash(parsedPayload),
    });

    revalidateAccountingPaths(organizationSlug);

    return {
      success: true,
      message: "Asiento revertido correctamente.",
      entityId: result.journalEntryId,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to reverse journal entry");
    return buildErrorResult(error);
  }
}

export async function transitionAccountingPeriodAction(
  organizationSlug: string,
  action: "close" | "reopen" | "lock",
  payload: AccountingPeriodActionInput,
): Promise<AccountingActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    const parsedPayload = accountingPeriodActionSchema.parse(payload);

    if (action === "close") {
      assertOrganizationPermission(context, PERIOD_CLOSE_PERMISSIONS);
    } else if (action === "reopen") {
      assertOrganizationPermission(context, PERIOD_REOPEN_PERMISSIONS);
    } else {
      assertOrganizationPermission(context, PERIOD_LOCK_PERMISSIONS);
    }

    const period = await transitionAccountingPeriod({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      periodId: parsedPayload.periodId,
      action,
    });

    revalidateAccountingPaths(organizationSlug);

    return {
      success: true,
      message:
        action === "close"
          ? "Periodo cerrado correctamente."
          : action === "reopen"
            ? "Periodo reabierto correctamente."
            : "Periodo bloqueado correctamente.",
      entityId: period.id,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to transition accounting period");
    return buildErrorResult(error);
  }
}
