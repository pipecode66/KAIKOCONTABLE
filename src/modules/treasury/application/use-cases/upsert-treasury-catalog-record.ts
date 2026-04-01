import { prisma } from "@/lib/prisma/client";
import { DomainError } from "@/lib/errors";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { treasuryCatalogRepository } from "@/modules/treasury/infrastructure/repositories/treasury-catalog.repository";

type UpsertTreasuryCatalogRecordInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  catalog: TreasuryCatalogKey;
  data: Record<string, unknown>;
};

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeOptional(value: unknown) {
  const normalized = sanitizeString(value);
  return normalized || null;
}

export async function upsertTreasuryCatalogRecord(input: UpsertTreasuryCatalogRecordInput) {
  return prisma.$transaction(async (tx) => {
    switch (input.catalog) {
      case "payment-methods": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await treasuryCatalogRepository.findPaymentMethodByCode(input.organizationId, code, tx);
        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe un metodo de pago con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await treasuryCatalogRepository.upsertPaymentMethod(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            description: sanitizeOptional(input.data.description),
          },
          tx,
        );

        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: id ? "UPDATED" : "CREATED",
          entityType: "PaymentMethod",
          entityId: record.id,
          correlationId: input.correlationId,
        }, tx);

        return record;
      }

      case "bank-accounts": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await treasuryCatalogRepository.findBankAccountByCode(input.organizationId, code, tx);
        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe una cuenta bancaria con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await treasuryCatalogRepository.upsertBankAccount(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            bankName: sanitizeString(input.data.bankName),
            accountNumber: sanitizeString(input.data.accountNumber),
            accountType: sanitizeString(input.data.accountType),
          },
          tx,
        );

        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: id ? "UPDATED" : "CREATED",
          entityType: "BankAccount",
          entityId: record.id,
          correlationId: input.correlationId,
        }, tx);

        return record;
      }

      case "cash-accounts": {
        const id = sanitizeString(input.data.id);
        const code = sanitizeString(input.data.code);
        const duplicate = await treasuryCatalogRepository.findCashAccountByCode(input.organizationId, code, tx);
        if (duplicate && duplicate.id !== id) {
          throw new DomainError("Ya existe una caja con ese codigo.", "DUPLICATE_CODE");
        }

        const record = await treasuryCatalogRepository.upsertCashAccount(
          input.organizationId,
          {
            id: id || undefined,
            code,
            name: sanitizeString(input.data.name),
            location: sanitizeOptional(input.data.location),
          },
          tx,
        );

        await writeAuditLog({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: id ? "UPDATED" : "CREATED",
          entityType: "CashAccount",
          entityId: record.id,
          correlationId: input.correlationId,
        }, tx);

        return record;
      }
    }
  });
}
