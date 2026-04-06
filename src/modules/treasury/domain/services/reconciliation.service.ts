import Decimal from "decimal.js";

import { normalizeMoney } from "@/lib/money/money.service";
import type { ReconciliationSuggestionDto } from "@/modules/treasury/dto/treasury.dto";

type BankStatementLineSnapshot = {
  id: string;
  transactionDate: Date;
  description: string;
  reference: string | null;
  amount: Decimal.Value;
};

type PaymentSnapshot = {
  id: string;
  paymentDate: Date;
  reference: string | null;
  direction: "RECEIVED" | "SENT";
  amount: Decimal.Value;
  thirdPartyName: string | null;
};

type TransferSnapshot = {
  id: string;
  transferDate: Date;
  reference: string | null;
  direction: "IN" | "OUT";
  amount: Decimal.Value;
};

function getDayDistance(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function normalizeMovementAmount(amount: Decimal.Value, direction: "RECEIVED" | "SENT" | "IN" | "OUT") {
  const normalized = normalizeMoney(amount);
  return direction === "RECEIVED" || direction === "IN" ? normalized : normalized.negated();
}

function referencesLookSimilar(left?: string | null, right?: string | null) {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

export function buildReconciliationSuggestions(input: {
  statementLines: BankStatementLineSnapshot[];
  payments: PaymentSnapshot[];
  outgoingTransfers: TransferSnapshot[];
  incomingTransfers: TransferSnapshot[];
}): ReconciliationSuggestionDto[] {
  const suggestions: ReconciliationSuggestionDto[] = [];

  const transferCandidates = [
    ...input.outgoingTransfers.map((transfer) => ({
      ...transfer,
      matchedDocumentType: "TRANSFER" as const,
      movementDate: transfer.transferDate,
      label: transfer.reference ?? `Traslado ${transfer.id.slice(-6)}`,
      signedAmount: normalizeMovementAmount(transfer.amount, transfer.direction),
    })),
    ...input.incomingTransfers.map((transfer) => ({
      ...transfer,
      matchedDocumentType: "TRANSFER" as const,
      movementDate: transfer.transferDate,
      label: transfer.reference ?? `Traslado ${transfer.id.slice(-6)}`,
      signedAmount: normalizeMovementAmount(transfer.amount, transfer.direction),
    })),
  ];

  const paymentCandidates = input.payments.map((payment) => ({
    ...payment,
    matchedDocumentType: "PAYMENT" as const,
    movementDate: payment.paymentDate,
    label: payment.reference ?? `Pago ${payment.id.slice(-6)} · ${payment.thirdPartyName ?? "Sin tercero"}`,
    signedAmount: normalizeMovementAmount(payment.amount, payment.direction),
  }));

  const candidates = [...paymentCandidates, ...transferCandidates];

  for (const line of input.statementLines) {
    const lineAmount = normalizeMoney(line.amount);
    const ranked = candidates
      .filter((candidate) => candidate.signedAmount.equals(lineAmount))
      .map((candidate) => {
        const dayDistance = getDayDistance(line.transactionDate, candidate.movementDate);
        const referenceMatch = referencesLookSimilar(line.reference, candidate.reference);
        return {
          candidate,
          dayDistance,
          referenceMatch,
        };
      })
      .filter((candidate) => candidate.dayDistance <= 7)
      .sort((left, right) => {
        if (left.referenceMatch !== right.referenceMatch) {
          return left.referenceMatch ? -1 : 1;
        }

        return left.dayDistance - right.dayDistance;
      });

    const best = ranked[0];
    if (!best) {
      continue;
    }

    suggestions.push({
      bankStatementLineId: line.id,
      transactionDateIso: line.transactionDate.toISOString(),
      description: line.description,
      reference: line.reference,
      amount: lineAmount.toString(),
      matchedDocumentType: best.candidate.matchedDocumentType,
      matchedDocumentId: best.candidate.id,
      matchedDocumentLabel: best.candidate.label,
      matchedAmount: best.candidate.signedAmount.toString(),
      confidence: best.referenceMatch || best.dayDistance <= 1 ? "high" : "medium",
      notes: best.referenceMatch
        ? "Coincidencia por monto y referencia."
        : `Coincidencia por monto y fecha aproximada (${Math.round(best.dayDistance)} dias).`,
    });
  }

  return suggestions;
}
