import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";
import type { TransferFormValues } from "@/modules/treasury/validators/treasury-operations.validator";

type UpsertTransferDraftInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: TransferFormValues;
};

export async function upsertTransferDraft(input: UpsertTransferDraftInput) {
  const organization = await accountingCoreRepository.getOrganizationContext(input.organizationId);

  return prisma.$transaction(async (tx) => {
    const sourceBankAccountId = input.data.sourceBankAccountId || null;
    const sourceCashAccountId = input.data.sourceCashAccountId || null;
    const destinationBankAccountId = input.data.destinationBankAccountId || null;
    const destinationCashAccountId = input.data.destinationCashAccountId || null;

    if (sourceBankAccountId) {
      const source = await treasuryOperationsRepository.findBankAccountById(
        input.organizationId,
        sourceBankAccountId,
        tx,
      );

      if (!source) {
        throw new NotFoundError("No encontramos la cuenta bancaria origen.");
      }
    }

    if (sourceCashAccountId) {
      const source = await treasuryOperationsRepository.findCashAccountById(
        input.organizationId,
        sourceCashAccountId,
        tx,
      );

      if (!source) {
        throw new NotFoundError("No encontramos la caja origen.");
      }
    }

    if (destinationBankAccountId) {
      const destination = await treasuryOperationsRepository.findBankAccountById(
        input.organizationId,
        destinationBankAccountId,
        tx,
      );

      if (!destination) {
        throw new NotFoundError("No encontramos la cuenta bancaria destino.");
      }
    }

    if (destinationCashAccountId) {
      const destination = await treasuryOperationsRepository.findCashAccountById(
        input.organizationId,
        destinationCashAccountId,
        tx,
      );

      if (!destination) {
        throw new NotFoundError("No encontramos la caja destino.");
      }
    }

    if (
      (sourceBankAccountId && sourceBankAccountId === destinationBankAccountId) ||
      (sourceCashAccountId && sourceCashAccountId === destinationCashAccountId)
    ) {
      throw new DomainError("El origen y el destino del traslado deben ser diferentes.", "INVALID_TRANSFER_ACCOUNTS");
    }

    const transfer = await treasuryOperationsRepository.saveTransferDraft(
      {
        organizationId: input.organizationId,
        currencyId: organization.baseCurrencyId,
        sourceBankAccountId,
        sourceCashAccountId,
        destinationBankAccountId,
        destinationCashAccountId,
        transferDate: new Date(input.data.transferDate),
        amount: new Prisma.Decimal(normalizeMoney(input.data.amount.replace(",", ".")).toString()),
        reference: input.data.reference?.trim() || null,
        notes: input.data.notes?.trim() || null,
        transferId: input.data.id,
        expectedVersion: input.data.version,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.data.id ? "UPDATED" : "CREATED",
        entityType: "Transfer",
        entityId: transfer.id,
        correlationId: input.correlationId,
        afterState: {
          amount: transfer.amount.toString(),
          transferDate: transfer.transferDate.toISOString(),
          reference: transfer.reference,
        },
      },
      tx,
    );

    return transfer;
  });
}
