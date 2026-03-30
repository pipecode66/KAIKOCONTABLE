import { prisma } from "@/lib/prisma/client";
import type { OrganizationSettingsInput } from "@/modules/organizations/validators/organization-settings.validator";

type CreateOrganizationInput = {
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  baseCurrencyId: string;
  createdById?: string;
  settings?: Partial<OrganizationSettingsInput>;
};

export async function createOrganization(input: CreateOrganizationInput) {
  return prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      legalName: input.legalName,
      taxId: input.taxId,
      baseCurrencyId: input.baseCurrencyId,
      createdById: input.createdById,
      settings: {
        create: {
          timezone: input.settings?.timezone ?? "America/Bogota",
          locale: input.settings?.locale ?? "es-CO",
          fiscalYearStartMonth: input.settings?.fiscalYearStartMonth ?? 1,
          numberFormat: input.settings?.numberFormat ?? "es-CO-currency",
          dateFormat: input.settings?.dateFormat ?? "dd/MM/yyyy",
        },
      },
    },
    include: {
      settings: true,
      baseCurrency: true,
    },
  });
}
