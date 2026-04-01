import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import type { LedgerAccountFormInput } from "@/modules/accounting/dto/ledger-account.dto";
import { ledgerAccountRepository } from "@/modules/accounting/infrastructure/repositories/ledger-account.repository";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";

type UpsertLedgerAccountInput = {
  organizationId: string;
  actorUserId: string;
  correlationId?: string;
  data: LedgerAccountFormInput;
};

export async function upsertLedgerAccount(input: UpsertLedgerAccountInput) {
  const sanitizedData: LedgerAccountFormInput = {
    ...input.data,
    code: input.data.code.trim().toUpperCase(),
    name: input.data.name.trim(),
    description: input.data.description?.trim() || undefined,
    parentId: input.data.parentId || undefined,
    allowManualEntries: input.data.isPosting ? input.data.allowManualEntries : false,
  };

  const existing = sanitizedData.id
    ? await ledgerAccountRepository.findById({
        organizationId: input.organizationId,
        accountId: sanitizedData.id,
      })
    : null;

  if (sanitizedData.id && !existing) {
    throw new NotFoundError("No encontramos la cuenta contable que intentas editar.");
  }

  if (existing?.deletedAt) {
    throw new DomainError("La cuenta archivada no puede modificarse.");
  }

  const codeOwner = await ledgerAccountRepository.findByCode({
    organizationId: input.organizationId,
    code: sanitizedData.code,
  });

  if (codeOwner && codeOwner.id !== sanitizedData.id) {
    throw new DomainError("Ya existe una cuenta con ese codigo dentro de la organizacion.");
  }

  const activeChildren = existing
    ? await ledgerAccountRepository.countActiveChildren({
        organizationId: input.organizationId,
        accountId: existing.id,
      })
    : 0;

  if (activeChildren > 0 && sanitizedData.isPosting) {
    throw new DomainError(
      "Una cuenta con hijas activas no puede quedar marcada como cuenta de posteo.",
    );
  }

  if (sanitizedData.parentId) {
    if (sanitizedData.parentId === sanitizedData.id) {
      throw new DomainError("La cuenta no puede ser su propio padre.");
    }

    const parent = await ledgerAccountRepository.findParent({
      organizationId: input.organizationId,
      parentId: sanitizedData.parentId,
    });

    if (!parent) {
      throw new DomainError("La cuenta padre seleccionada no existe o ya fue archivada.");
    }

    if (parent.type !== sanitizedData.type) {
      throw new DomainError("La cuenta padre debe compartir el mismo tipo contable.");
    }

    if (
      sanitizedData.id &&
      (await ledgerAccountRepository.wouldCreateCycle({
        organizationId: input.organizationId,
        accountId: sanitizedData.id,
        nextParentId: sanitizedData.parentId,
      }))
    ) {
      throw new DomainError("La jerarquia propuesta genera un ciclo y no se puede guardar.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const savedAccount = existing
      ? await ledgerAccountRepository.update({
          accountId: existing.id,
          data: sanitizedData,
          db: tx,
        })
      : await ledgerAccountRepository.create({
          organizationId: input.organizationId,
          data: sanitizedData,
          db: tx,
        });

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: existing ? "UPDATED" : "CREATED",
        entityType: "LedgerAccount",
        entityId: savedAccount.id,
        correlationId: input.correlationId,
        beforeState: existing,
        afterState: savedAccount,
        metadata: {
          module: "accounting",
          feature: "ledger_accounts",
        },
      },
      tx,
    );

    return savedAccount;
  });
}
