"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { archiveTreasuryCatalogRecord } from "@/modules/treasury/application/use-cases/archive-treasury-catalog-record";
import { upsertTreasuryCatalogRecord } from "@/modules/treasury/application/use-cases/upsert-treasury-catalog-record";
import { treasuryCatalogSchemas } from "@/modules/treasury/validators/catalogs.validator";
import type { CatalogActionResult } from "@/modules/shared/dto/catalog-management.dto";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

const MANAGE_PERMISSIONS = ["treasury.manage", "catalogs.manage"];

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

function revalidateCatalogPath(organizationSlug: string, catalog: TreasuryCatalogKey) {
  revalidatePath(`/${organizationSlug}/treasury/catalogs/${catalog}`);
}

export async function saveTreasuryCatalogAction(
  organizationSlug: string,
  catalog: TreasuryCatalogKey,
  _prevState: CatalogActionResult,
  formData: FormData,
): Promise<CatalogActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);
    const schema = treasuryCatalogSchemas[catalog];
    const parsed = schema.parse(formDataToObject(formData)) as Record<string, unknown>;

    await upsertTreasuryCatalogRecord({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      catalog,
      data: parsed,
    });

    revalidateCatalogPath(organizationSlug, catalog);

    return {
      success: true,
      message: "Catalogo guardado correctamente.",
    };
  } catch (error) {
    logger.error({ error, correlationId, catalog }, "Failed to save treasury catalog");
    return buildErrorResult(error);
  }
}

export async function archiveTreasuryCatalogAction(
  organizationSlug: string,
  catalog: TreasuryCatalogKey,
  id: string,
): Promise<CatalogActionResult> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(organizationSlug);
    assertOrganizationPermission(context, MANAGE_PERMISSIONS);

    await archiveTreasuryCatalogRecord({
      organizationId: context.membership.organizationId,
      actorUserId: context.userId,
      correlationId,
      catalog,
      id,
    });

    revalidateCatalogPath(organizationSlug, catalog);

    return {
      success: true,
      message: "Registro archivado correctamente.",
    };
  } catch (error) {
    logger.error({ error, correlationId, catalog }, "Failed to archive treasury catalog");
    return buildErrorResult(error);
  }
}
