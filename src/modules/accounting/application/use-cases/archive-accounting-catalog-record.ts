import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";
import { accountingCatalogRepository } from "@/modules/accounting/infrastructure/repositories/accounting-catalog.repository";

type ArchiveAccountingCatalogRecordInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  catalog: Exclude<AccountingCatalogKey, "tax-rules">;
  id: string;
};

export async function archiveAccountingCatalogRecord(input: ArchiveAccountingCatalogRecordInput) {
  return prisma.$transaction(async (tx) => {
    switch (input.catalog) {
      case "third-parties": {
        const record = await accountingCatalogRepository.findThirdPartyById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos el tercero.");
        }
        const usages = await accountingCatalogRepository.countThirdPartyUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("El tercero ya tiene movimientos y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await accountingCatalogRepository.archiveThirdParty(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "ThirdParty",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
      case "taxes": {
        const record = await accountingCatalogRepository.findTaxById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos el impuesto.");
        }
        const usages = await accountingCatalogRepository.countTaxUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("El impuesto ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await accountingCatalogRepository.archiveTax(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "Tax",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
      case "cost-centers": {
        const record = await accountingCatalogRepository.findCostCenterById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos el centro de costo.");
        }
        const usages = await accountingCatalogRepository.countCostCenterUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("El centro de costo ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await accountingCatalogRepository.archiveCostCenter(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "CostCenter",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
      case "catalog-items": {
        const record = await accountingCatalogRepository.findCatalogItemById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos el item.");
        }
        const usages = await accountingCatalogRepository.countCatalogItemUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("El item ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await accountingCatalogRepository.archiveCatalogItem(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "CatalogItem",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
    }
  });
}
