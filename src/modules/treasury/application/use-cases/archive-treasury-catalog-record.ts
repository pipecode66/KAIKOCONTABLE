import { prisma } from "@/lib/prisma/client";
import { DomainError, NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { treasuryCatalogRepository } from "@/modules/treasury/infrastructure/repositories/treasury-catalog.repository";

type ArchiveTreasuryCatalogRecordInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  catalog: TreasuryCatalogKey;
  id: string;
};

export async function archiveTreasuryCatalogRecord(input: ArchiveTreasuryCatalogRecordInput) {
  return prisma.$transaction(async (tx) => {
    switch (input.catalog) {
      case "payment-methods": {
        const record = await treasuryCatalogRepository.findPaymentMethodById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos el metodo de pago.");
        }
        const usages = await treasuryCatalogRepository.countPaymentMethodUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("El metodo de pago ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await treasuryCatalogRepository.archivePaymentMethod(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "PaymentMethod",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
      case "bank-accounts": {
        const record = await treasuryCatalogRepository.findBankAccountById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos la cuenta bancaria.");
        }
        const usages = await treasuryCatalogRepository.countBankAccountUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("La cuenta bancaria ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await treasuryCatalogRepository.archiveBankAccount(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "BankAccount",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
      case "cash-accounts": {
        const record = await treasuryCatalogRepository.findCashAccountById(input.organizationId, input.id, tx);
        if (!record) {
          throw new NotFoundError("No encontramos la caja.");
        }
        const usages = await treasuryCatalogRepository.countCashAccountUsages(input.organizationId, input.id);
        if (usages > 0) {
          throw new DomainError("La caja ya esta en uso y no se puede archivar.", "CATALOG_IN_USE");
        }
        const archived = await treasuryCatalogRepository.archiveCashAccount(input.id, tx);
        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "DELETED",
          entityType: "CashAccount",
          entityId: archived.id,
          correlationId: input.correlationId,
        }, tx);
        return archived;
      }
    }
  });
}
