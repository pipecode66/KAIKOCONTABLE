import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { buildReconciliationSuggestions } from "@/modules/treasury/domain/services/reconciliation.service";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";
import type { ReconciliationCompleteValues } from "@/modules/treasury/validators/treasury-operations.validator";

type CompleteReconciliationInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: ReconciliationCompleteValues;
};

export async function completeReconciliation(input: CompleteReconciliationInput) {
  return prisma.$transaction(async (tx) => {
    const reconciliation = await treasuryOperationsRepository.findReconciliationById(
      {
        organizationId: input.organizationId,
        reconciliationId: input.data.reconciliationId,
      },
      tx,
    );

    if (!reconciliation || !reconciliation.bankAccountId) {
      throw new NotFoundError("No encontramos la conciliacion seleccionada.");
    }

    const [statementLines, candidates] = await Promise.all([
      treasuryOperationsRepository.listUnreconciledBankStatementLines({
        organizationId: input.organizationId,
        bankAccountId: reconciliation.bankAccountId,
        periodStart: reconciliation.periodStart,
        periodEnd: reconciliation.periodEnd,
      }),
      treasuryOperationsRepository.listPostedBankDocumentsForMatching({
        organizationId: input.organizationId,
        bankAccountId: reconciliation.bankAccountId,
        periodStart: reconciliation.periodStart,
        periodEnd: reconciliation.periodEnd,
      }),
    ]);

    const suggestions = buildReconciliationSuggestions({
      statementLines: statementLines.map((line) => ({
        id: line.id,
        transactionDate: line.transactionDate,
        description: line.description,
        reference: line.reference ?? null,
        amount: line.amount,
      })),
      payments: candidates.payments.map((payment) => ({
        id: payment.id,
        paymentDate: payment.paymentDate,
        reference: payment.reference ?? null,
        direction: payment.direction,
        amount: payment.amount,
        thirdPartyName: payment.thirdParty?.name ?? null,
      })),
      outgoingTransfers: candidates.outgoingTransfers.map((transfer) => ({
        id: transfer.id,
        transferDate: transfer.transferDate,
        reference: transfer.reference ?? null,
        direction: "OUT" as const,
        amount: transfer.amount,
      })),
      incomingTransfers: candidates.incomingTransfers.map((transfer) => ({
        id: transfer.id,
        transferDate: transfer.transferDate,
        reference: transfer.reference ?? null,
        direction: "IN" as const,
        amount: transfer.amount,
      })),
    });

    const suggestionsByLineId = new Map(suggestions.map((suggestion) => [suggestion.bankStatementLineId, suggestion]));

    for (const selection of input.data.selections) {
      const suggested = suggestionsByLineId.get(selection.bankStatementLineId);
      if (!suggested) {
        throw new DomainError(
          "Una de las coincidencias seleccionadas ya no esta disponible para conciliacion.",
          "INVALID_RECONCILIATION_SELECTION",
        );
      }

      if (
        suggested.matchedDocumentId !== selection.matchedDocumentId ||
        suggested.matchedDocumentType !== selection.matchedDocumentType
      ) {
        throw new DomainError(
          "La seleccion enviada no coincide con la sugerencia disponible.",
          "INVALID_RECONCILIATION_SELECTION",
        );
      }
    }

    const updated = await treasuryOperationsRepository.completeReconciliation(
      {
        reconciliationId: reconciliation.id,
        organizationId: input.organizationId,
        lines: input.data.selections.map((selection) => ({
          bankStatementLineId: selection.bankStatementLineId,
          matchedDocumentType: selection.matchedDocumentType,
          matchedDocumentId: selection.matchedDocumentId,
          matchedAmount: new Prisma.Decimal(selection.matchedAmount),
          notes: selection.notes?.trim() || null,
        })),
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "UPDATED",
        entityType: "Reconciliation",
        entityId: updated.id,
        correlationId: input.correlationId,
        afterState: {
          status: updated.status,
          lines: input.data.selections.length,
        },
      },
      tx,
    );

    return updated;
  });
}
