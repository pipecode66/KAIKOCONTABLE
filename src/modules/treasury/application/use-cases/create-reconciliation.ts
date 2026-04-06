import { Prisma } from "@prisma/client";

import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { ReconciliationCreateValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type CreateReconciliationInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: ReconciliationCreateValues;
};

export async function createReconciliation(input: CreateReconciliationInput) {
  const periodStart = new Date(input.data.periodStart);
  const periodEnd = new Date(input.data.periodEnd);

  return prisma.$transaction(async (tx) => {
    const bankAccount = await treasuryOperationsRepository.findBankAccountById(
      input.organizationId,
      input.data.bankAccountId,
      tx,
    );

    if (!bankAccount) {
      throw new NotFoundError("No encontramos la cuenta bancaria para conciliar.");
    }

    const [bookBalance, statementBalance] = await Promise.all([
      treasuryOperationsRepository.computeBankBookBalance({
        organizationId: input.organizationId,
        bankAccountId: bankAccount.id,
        periodEnd,
      }),
      treasuryOperationsRepository.computeStatementBalance({
        organizationId: input.organizationId,
        bankAccountId: bankAccount.id,
        periodEnd,
      }),
    ]);

    const reconciliation = await treasuryOperationsRepository.createReconciliation(
      {
        organizationId: input.organizationId,
        bankAccountId: bankAccount.id,
        periodStart,
        periodEnd,
        statementBalance: new Prisma.Decimal(statementBalance.toString()),
        bookBalance: new Prisma.Decimal(bookBalance.toString()),
        notes: input.data.notes?.trim() || null,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "CREATED",
        entityType: "Reconciliation",
        entityId: reconciliation.id,
        correlationId: input.correlationId,
        afterState: {
          bankAccountId: reconciliation.bankAccountId,
          periodStart: reconciliation.periodStart.toISOString(),
          periodEnd: reconciliation.periodEnd.toISOString(),
        },
      },
      tx,
    );

    return reconciliation;
  });
}
