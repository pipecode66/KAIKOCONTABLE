import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { ledgerAccountRepository } from "@/modules/accounting/infrastructure/repositories/ledger-account.repository";

type ArchiveLedgerAccountInput = {
  organizationId: string;
  accountId: string;
  actorUserId: string;
  correlationId?: string;
};

export async function archiveLedgerAccount(input: ArchiveLedgerAccountInput) {
  const existing = await ledgerAccountRepository.findById({
    organizationId: input.organizationId,
    accountId: input.accountId,
  });

  if (!existing) {
    throw new NotFoundError("No encontramos la cuenta que intentas archivar.");
  }

  if (existing.deletedAt) {
    throw new DomainError("La cuenta ya se encuentra archivada.");
  }

  const activeChildren = await ledgerAccountRepository.countActiveChildren({
    organizationId: input.organizationId,
    accountId: input.accountId,
  });

  if (activeChildren > 0) {
    throw new DomainError(
      "No puedes archivar una cuenta que todavia tiene cuentas hijas activas.",
    );
  }

  const usageCount = await ledgerAccountRepository.countUsages({
    organizationId: input.organizationId,
    accountId: input.accountId,
  });

  if (usageCount > 0) {
    throw new DomainError(
      "La cuenta ya fue usada en documentos o reglas contables. Conservamos la trazabilidad y evitamos archivarla.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const archivedAccount = await ledgerAccountRepository.archive({
      accountId: input.accountId,
      db: tx,
    });

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "DELETED",
        entityType: "LedgerAccount",
        entityId: archivedAccount.id,
        correlationId: input.correlationId,
        beforeState: existing,
        afterState: archivedAccount,
        metadata: {
          module: "accounting",
          feature: "ledger_accounts",
          mode: "soft_delete",
        },
      },
      tx,
    );

    return archivedAccount;
  });
}
