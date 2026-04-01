import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney, normalizeRate } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";
import { accountingCatalogRepository } from "@/modules/accounting/infrastructure/repositories/accounting-catalog.repository";

type UpsertAccountingCatalogRecordInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  catalog: AccountingCatalogKey;
  data: Record<string, unknown>;
};

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeOptional(value: unknown) {
  const normalized = sanitizeString(value);
  return normalized || null;
}

function sanitizeBoolean(value: unknown) {
  return value === true || value === "on" || value === "true";
}

function sanitizeDate(value: unknown) {
  const normalized = sanitizeString(value);
  return normalized ? new Date(`${normalized}T12:00:00.000Z`) : null;
}

function normalizeDecimalInput(value: unknown) {
  const normalized = sanitizeString(value).replace(",", ".");
  return normalized;
}

export async function upsertAccountingCatalogRecord(input: UpsertAccountingCatalogRecordInput) {
  return prisma.$transaction(async (tx) => {
    switch (input.catalog) {
      case "third-parties": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await accountingCatalogRepository.findThirdPartyByCode(
          input.organizationId,
          code,
          tx,
        );

        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe un tercero con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await accountingCatalogRepository.upsertThirdParty(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            legalName: sanitizeOptional(input.data.legalName),
            taxId: sanitizeOptional(input.data.taxId),
            email: sanitizeOptional(input.data.email),
            phone: sanitizeOptional(input.data.phone),
            municipalityCode: sanitizeOptional(input.data.municipalityCode),
            economicActivityCode: sanitizeOptional(input.data.economicActivityCode),
            type: sanitizeString(input.data.type) as Prisma.ThirdPartyUncheckedCreateInput["type"],
            taxClassification:
              sanitizeOptional(input.data.taxClassification) as Prisma.ThirdPartyUncheckedCreateInput["taxClassification"],
            vatResponsibility:
              sanitizeOptional(input.data.vatResponsibility) as Prisma.ThirdPartyUncheckedCreateInput["vatResponsibility"],
            isWithholdingAgent: sanitizeBoolean(input.data.isWithholdingAgent),
          },
          tx,
        );

        await writeAuditLog(
          {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "ThirdParty",
            entityId: record.id,
            correlationId: input.correlationId,
            afterState: {
              code: record.code,
              name: record.name,
              type: record.type,
            },
          },
          tx,
        );

        return record;
      }

      case "taxes": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await accountingCatalogRepository.findTaxByCode(input.organizationId, code, tx);

        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe un impuesto con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await accountingCatalogRepository.upsertTax(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            kind: sanitizeString(input.data.kind) as Prisma.TaxUncheckedCreateInput["kind"],
            treatment: sanitizeString(input.data.treatment) as Prisma.TaxUncheckedCreateInput["treatment"],
            rate: new Prisma.Decimal(normalizeRate(normalizeDecimalInput(input.data.rate)).toString()),
            isWithholding: sanitizeBoolean(input.data.isWithholding),
          },
          tx,
        );

        await writeAuditLog(
          {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "Tax",
            entityId: record.id,
            correlationId: input.correlationId,
            afterState: {
              code: record.code,
              name: record.name,
              rate: record.rate.toString(),
            },
          },
          tx,
        );

        return record;
      }

      case "tax-rules": {
        const id = sanitizeString(input.data.id);
        const taxId = sanitizeString(input.data.taxId);
        const tax = await accountingCatalogRepository.findTaxById(input.organizationId, taxId, tx);

        if (!tax) {
          throw new NotFoundError("No encontramos el impuesto asociado a la regla.");
        }

        const record = await accountingCatalogRepository.upsertTaxRule(
          input.organizationId,
          {
            id: id || undefined,
            taxId,
            name: sanitizeString(input.data.name),
            effectiveFrom: sanitizeDate(input.data.effectiveFrom) ?? new Date(),
            effectiveTo: sanitizeDate(input.data.effectiveTo),
            minimumBaseAmount: sanitizeString(input.data.minimumBaseAmount)
              ? new Prisma.Decimal(normalizeMoney(normalizeDecimalInput(input.data.minimumBaseAmount)).toString())
              : null,
            rateOverride: sanitizeString(input.data.rateOverride)
              ? new Prisma.Decimal(normalizeRate(normalizeDecimalInput(input.data.rateOverride)).toString())
              : null,
            priority: Number(sanitizeString(input.data.priority) || "100"),
            thirdPartyType:
              sanitizeOptional(input.data.thirdPartyType) as Prisma.TaxRuleUncheckedCreateInput["thirdPartyType"],
            thirdPartyTaxClassification:
              sanitizeOptional(input.data.thirdPartyTaxClassification) as Prisma.TaxRuleUncheckedCreateInput["thirdPartyTaxClassification"],
            vatResponsibility:
              sanitizeOptional(input.data.vatResponsibility) as Prisma.TaxRuleUncheckedCreateInput["vatResponsibility"],
            municipalityCode: sanitizeOptional(input.data.municipalityCode),
            economicActivityCode: sanitizeOptional(input.data.economicActivityCode),
            fiscalTreatment:
              sanitizeOptional(input.data.fiscalTreatment) as Prisma.TaxRuleUncheckedCreateInput["fiscalTreatment"],
            documentType: sanitizeOptional(input.data.documentType),
            operationType: sanitizeOptional(input.data.operationType),
          },
          tx,
        );

        await writeAuditLog(
          {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "TaxRule",
            entityId: record.id,
            correlationId: input.correlationId,
            afterState: {
              name: record.name,
              priority: record.priority,
              taxId: record.taxId,
            },
          },
          tx,
        );

        return record;
      }

      case "cost-centers": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await accountingCatalogRepository.findCostCenterByCode(input.organizationId, code, tx);

        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe un centro de costo con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await accountingCatalogRepository.upsertCostCenter(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            description: sanitizeOptional(input.data.description),
          },
          tx,
        );

        await writeAuditLog(
          {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "CostCenter",
            entityId: record.id,
            correlationId: input.correlationId,
            afterState: {
              code: record.code,
              name: record.name,
            },
          },
          tx,
        );

        return record;
      }

      case "catalog-items": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await accountingCatalogRepository.findCatalogItemByCode(input.organizationId, code, tx);

        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe un item con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await accountingCatalogRepository.upsertCatalogItem(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            description: sanitizeOptional(input.data.description),
            defaultLedgerAccountId: sanitizeOptional(input.data.defaultLedgerAccountId),
            defaultTaxId: sanitizeOptional(input.data.defaultTaxId),
            defaultUnitPrice: new Prisma.Decimal(
              normalizeMoney(normalizeDecimalInput(input.data.defaultUnitPrice)).toString(),
            ),
            isActive: sanitizeBoolean(input.data.isActive),
          },
          tx,
        );

        await writeAuditLog(
          {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: id ? "UPDATED" : "CREATED",
            entityType: "CatalogItem",
            entityId: record.id,
            correlationId: input.correlationId,
            afterState: {
              code: record.code,
              name: record.name,
              isActive: record.isActive,
            },
          },
          tx,
        );

        return record;
      }
    }
  });
}
