import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { parseBankStatementCsv } from "@/lib/csv/bank-statement-parser";
import { normalizeMoney } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type ProcessBankStatementImportInput = {
  organizationId: string;
  correlationId?: string;
  importId: string;
  csvContent: string;
};

function parseDecimalInput(value: string) {
  const normalized = value.trim();
  if (normalized.includes(",") && normalized.includes(".")) {
    return normalized.replaceAll(",", "");
  }

  return normalized.replace(",", ".");
}

export async function processBankStatementImport(input: ProcessBankStatementImportInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const statementImport = await treasuryOperationsRepository.findStatementImportById(
        {
          organizationId: input.organizationId,
          importId: input.importId,
        },
        tx,
      );

      if (!statementImport) {
        throw new NotFoundError("No encontramos la importacion del extracto.");
      }

      await treasuryOperationsRepository.markStatementImportProcessing(statementImport.id, tx);

      const parsedRows = parseBankStatementCsv(input.csvContent);
      if (!parsedRows.length) {
        throw new DomainError("El CSV del extracto no trae filas validas.", "EMPTY_STATEMENT_IMPORT");
      }

      const rows = parsedRows.map((row) => {
        const transactionDate = new Date(row.transactionDate);
        if (Number.isNaN(transactionDate.getTime())) {
          throw new DomainError("El extracto contiene una fecha invalida.", "INVALID_STATEMENT_DATE");
        }

        return {
          transactionDate,
          description: row.description.trim(),
          reference: row.reference?.trim() || null,
          amount: new Prisma.Decimal(normalizeMoney(parseDecimalInput(row.amount)).toString()),
          balance: row.balance
            ? new Prisma.Decimal(normalizeMoney(parseDecimalInput(row.balance)).toString())
            : null,
        };
      });

      await treasuryOperationsRepository.replaceStatementImportLines(
        {
          importId: statementImport.id,
          organizationId: input.organizationId,
          bankAccountId: statementImport.bankAccountId,
          rows,
        },
        tx,
      );

      await treasuryOperationsRepository.markStatementImportCompleted(
        {
          importId: statementImport.id,
          importedAt: new Date(),
          rowsCount: rows.length,
        },
        tx,
      );

      if (statementImport.attachmentId) {
        await tx.attachment.update({
          where: { id: statementImport.attachmentId },
          data: {
            isTemporary: false,
          },
        });
      }

      await writeAuditLog(
        {
          organizationId: input.organizationId,
          action: "UPDATED",
          entityType: "BankStatementImport",
          entityId: statementImport.id,
          correlationId: input.correlationId ?? null,
          afterState: {
            rowsCount: rows.length,
            status: "COMPLETED",
          },
        },
        tx,
      );

      return {
        importId: statementImport.id,
        rowsCount: rows.length,
      };
    });
  } catch (error) {
    await prisma.$transaction(async (tx) => {
      const statementImport = await treasuryOperationsRepository.findStatementImportById(
        {
          organizationId: input.organizationId,
          importId: input.importId,
        },
        tx,
      );

      if (!statementImport) {
        return;
      }

      await treasuryOperationsRepository.markStatementImportFailed(statementImport.id, tx);
      await writeAuditLog(
        {
          organizationId: input.organizationId,
          action: "UPDATED",
          entityType: "BankStatementImport",
          entityId: statementImport.id,
          correlationId: input.correlationId ?? null,
          metadata: {
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        tx,
      );
    });

    throw error;
  }
}
