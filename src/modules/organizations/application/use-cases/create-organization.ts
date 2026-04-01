import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { organizationSettingsSchema } from "@/modules/organizations/validators/organization-settings.validator";

type CreateOrganizationInput = {
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  baseCurrencyId: string;
  createdById: string;
  ownerUserId: string;
  ownerRoleKey?: string;
  settings: {
    timezone: string;
    locale: string;
    fiscalYearStartMonth: number;
    numberFormat: string;
    dateFormat: string;
  };
  correlationId?: string;
};

export async function createOrganization(input: CreateOrganizationInput) {
  const parsedSettings = organizationSettingsSchema.parse(input.settings);

  return prisma.$transaction(async (tx) => {
    const existingOrganization = await tx.organization.findUnique({
      where: {
        slug: input.slug,
      },
      select: {
        id: true,
      },
    });

    if (existingOrganization) {
      throw new DomainError("Ya existe una organizacion con ese slug.");
    }

    const baseCurrency = await tx.currency.findUnique({
      where: {
        id: input.baseCurrencyId,
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!baseCurrency) {
      throw new NotFoundError("No encontramos la moneda base seleccionada.");
    }

    const ownerRole = await tx.role.findFirst({
      where: {
        key: input.ownerRoleKey ?? "admin",
        isSystem: true,
      },
      select: {
        id: true,
        key: true,
      },
    });

    if (!ownerRole) {
      throw new NotFoundError("No encontramos el rol base para crear la organizacion.");
    }

    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        legalName: input.legalName || null,
        taxId: input.taxId || null,
        baseCurrencyId: input.baseCurrencyId,
        createdById: input.createdById,
        settings: {
          create: parsedSettings,
        },
        memberships: {
          create: {
            userId: input.ownerUserId,
            roleId: ownerRole.id,
            status: "ACTIVE",
            isActive: true,
            lastAccessedAt: new Date(),
          },
        },
      },
      include: {
        settings: true,
        baseCurrency: true,
        memberships: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    await writeAuditLog(
      {
        organizationId: organization.id,
        actorUserId: input.createdById,
        action: "CREATED",
        entityType: "Organization",
        entityId: organization.id,
        correlationId: input.correlationId ?? null,
        afterState: {
          name: organization.name,
          slug: organization.slug,
          baseCurrencyId: organization.baseCurrencyId,
          ownerRole: ownerRole.key,
        },
      },
      tx,
    );

    return organization;
  });
}
