import { NotFoundError } from "@/lib/errors";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { prisma } from "@/lib/prisma/client";
import { uploadObject } from "@/lib/storage/object-storage";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import type { StatementImportValues } from "@/modules/treasury/validators/treasury-operations.validator";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type RequestBankStatementImportInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: StatementImportValues;
};

export async function requestBankStatementImport(input: RequestBankStatementImportInput) {
  const uploaded = await uploadObject({
    fileName: input.data.fileName,
    contentType: "text/csv",
    body: Buffer.from(input.data.csvContent, "utf8"),
  });

  return prisma.$transaction(async (tx) => {
    const bankAccount = await treasuryOperationsRepository.findBankAccountById(
      input.organizationId,
      input.data.bankAccountId,
      tx,
    );

    if (!bankAccount) {
      throw new NotFoundError("No encontramos la cuenta bancaria del extracto.");
    }

    const attachment = await tx.attachment.create({
      data: {
        organizationId: input.organizationId,
        fileName: input.data.fileName,
        storageKey: uploaded.storageKey,
        contentType: uploaded.contentType,
        byteSize: uploaded.byteSize,
        isTemporary: true,
        attachedType: "BankStatementImport",
      },
    });

    const statementImport = await treasuryOperationsRepository.createStatementImport(
      {
        organizationId: input.organizationId,
        bankAccountId: input.data.bankAccountId,
        attachmentId: attachment.id,
        fileName: input.data.fileName,
      },
      tx,
    );

    await tx.attachment.update({
      where: { id: attachment.id },
      data: {
        attachedId: statementImport.id,
      },
    });

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "CREATED",
        entityType: "BankStatementImport",
        entityId: statementImport.id,
        correlationId: input.correlationId,
        afterState: {
          fileName: statementImport.fileName,
          bankAccountId: statementImport.bankAccountId,
        },
      },
      tx,
    );

    await addOutboxMessage(
      {
        organizationId: input.organizationId,
        eventType: "treasury.statement_import.requested",
        aggregateType: "BankStatementImport",
        aggregateId: statementImport.id,
        correlationId: input.correlationId,
        dedupeKey: `treasury:statement-import:requested:${statementImport.id}`,
        payload: {
          importId: statementImport.id,
          bankAccountId: statementImport.bankAccountId,
          fileName: statementImport.fileName,
          csvContent: input.data.csvContent,
        },
      },
      tx,
    );

    return statementImport;
  });
}
