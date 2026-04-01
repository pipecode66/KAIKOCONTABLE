"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";

import { DomainError, KaikoError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { createCorrelationId } from "@/lib/request-context/correlation";
import { createOrganization } from "@/modules/organizations/application/use-cases/create-organization";
import { createOrganizationSchema } from "@/modules/organizations/validators/create-organization.validator";
import {
  assertOrganizationPermission,
  getAuthenticatedOrganizationContext,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export type CreateOrganizationActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  redirectTo?: string;
};

const CREATE_ORGANIZATION_PERMISSIONS = ["organizations.manage", "admin.manage"];

function buildCreateOrganizationError(error: unknown): CreateOrganizationActionState {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Revisa los datos de la organizacion e intenta nuevamente.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof DomainError || error instanceof KaikoError) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: false,
    message: "No pudimos crear la organizacion. Intenta de nuevo.",
  };
}

function normalizeOrganizationSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createOrganizationAction(
  currentOrganizationSlug: string,
  _previousState: CreateOrganizationActionState,
  formData: FormData,
): Promise<CreateOrganizationActionState> {
  const correlationId = createCorrelationId();

  try {
    const context = await getAuthenticatedOrganizationContext(currentOrganizationSlug);
    assertOrganizationPermission(context, CREATE_ORGANIZATION_PERMISSIONS);

    const rawName = String(formData.get("name") ?? "");
    const requestedSlug = String(formData.get("slug") ?? "");
    const normalizedSlug = normalizeOrganizationSlug(requestedSlug || rawName);

    const payload = createOrganizationSchema.parse({
      name: rawName,
      slug: normalizedSlug,
      legalName: String(formData.get("legalName") ?? ""),
      taxId: String(formData.get("taxId") ?? ""),
      baseCurrencyId: String(formData.get("baseCurrencyId") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
      locale: String(formData.get("locale") ?? ""),
      fiscalYearStartMonth: formData.get("fiscalYearStartMonth"),
      numberFormat: String(formData.get("numberFormat") ?? ""),
      dateFormat: String(formData.get("dateFormat") ?? ""),
    });

    const organization = await createOrganization({
      name: payload.name,
      slug: payload.slug,
      legalName: payload.legalName || undefined,
      taxId: payload.taxId || undefined,
      baseCurrencyId: payload.baseCurrencyId,
      createdById: context.userId,
      ownerUserId: context.userId,
      settings: {
        timezone: payload.timezone,
        locale: payload.locale,
        fiscalYearStartMonth: payload.fiscalYearStartMonth,
        numberFormat: payload.numberFormat,
        dateFormat: payload.dateFormat,
      },
      correlationId,
    });

    revalidatePath("/");
    revalidatePath(`/${currentOrganizationSlug}/organizations`);
    revalidatePath(`/${organization.slug}/dashboard`);

    return {
      success: true,
      message: "Organizacion creada correctamente.",
      redirectTo: `/${organization.slug}/dashboard`,
    };
  } catch (error) {
    logger.error({ error, correlationId }, "Failed to create organization");
    return buildCreateOrganizationError(error);
  }
}
