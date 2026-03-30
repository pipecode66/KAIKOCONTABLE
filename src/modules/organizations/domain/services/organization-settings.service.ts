import { prisma } from "@/lib/prisma/client";
import type { OrganizationSettingsInput } from "@/modules/organizations/validators/organization-settings.validator";

export async function getOrganizationSettings(organizationId: string) {
  return prisma.organizationSettings.findUnique({
    where: { organizationId },
  });
}

export async function updateOrganizationSettings(
  organizationId: string,
  input: OrganizationSettingsInput,
) {
  return prisma.organizationSettings.update({
    where: { organizationId },
    data: input,
  });
}
