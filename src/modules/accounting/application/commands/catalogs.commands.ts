"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";
import { archiveAccountingCatalogRecord } from "@/modules/accounting/application/use-cases/archive-accounting-catalog-record";
import { upsertAccountingCatalogRecord } from "@/modules/accounting/application/use-cases/upsert-accounting-catalog-record";
import { accountingCatalogSchemas } from "@/modules/accounting/validators/catalogs.validator";
import type { CatalogActionResult } from "@/modules/shared/dto/catalog-management.dto";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const MANAGE_PERMISSIONS = ["catalogs.manage", "accounting.manage"];

function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue | undefined>;
}

function buildErrorResult(error: unknown): CatalogActionResult {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos del formulario.",
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
    message: "No pudimos guardar el catalogo en este momento.",
  };
}

function revalidateCatalogPaths(organizationSlug: string, catalog: AccountingCatalogKey) {
  revalidatePath(`/${organizationSlug}/accounting/catalogs/${catalog}`);
}

export async function saveAccountingCatalogAction(
  organizationSlug: string,
  catalog: AccountingCatalogKey,
  _prevState: CatalogActionResult,
  formData: FormData,
): Promise<CatalogActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);
    const schema = accountingCatalogSchemas[catalog];
    const parsed = schema.parse(formDataToObject(formData)) as Record<string, unknown>;

    await upsertAccountingCatalogRecord({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      catalog,
      data: parsed,
    });

    revalidateCatalogPaths(organizationSlug, catalog);

    return {
      success: true,
      message: "Catalogo guardado correctamente.",
    };
  } catch (error) {
    logger.error({ error, correlationId, catalog }, "Failed to save accounting catalog");
    return buildErrorResult(error);
  }
}

export async function archiveAccountingCatalogAction(
  organizationSlug: string,
  catalog: Exclude<AccountingCatalogKey, "tax-rules">,
  id: string,
): Promise<CatalogActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);

    await archiveAccountingCatalogRecord({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      catalog,
      id,
    });

    revalidateCatalogPaths(organizationSlug, catalog);

    return {
      success: true,
      message: "Registro archivado correctamente.",
    };
  } catch (error) {
    logger.error({ error, correlationId, catalog }, "Failed to archive accounting catalog");
    return buildErrorResult(error);
  }
}
