import Decimal from "decimal.js";
import type { Tax } from "@prisma/client";

import { calculateTax, normalizeMoney, sumMoney } from "@/lib/money/money.service";
import { DomainError } from "@/lib/errors";

export type OperationalDocumentLineInput = {
  description: string;
  quantity: Decimal.Value;
  unitPrice: Decimal.Value;
  tax?: Pick<Tax, "id" | "code" | "rate" | "isWithholding"> | null;
};

export type ComputedOperationalDocumentLine = {
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  lineSubtotal: Decimal;
  taxableBase: Decimal;
  taxAmount: Decimal;
  lineTotal: Decimal;
  taxId: string | null;
  taxCode: string | null;
  isWithholding: boolean;
};

export type ComputedOperationalDocumentTotals = {
  lines: ComputedOperationalDocumentLine[];
  subtotal: Decimal;
  taxTotal: Decimal;
  withholdingTotal: Decimal;
  total: Decimal;
  balanceDue: Decimal;
};

export function computeOperationalDocumentTotals(
  lines: OperationalDocumentLineInput[],
): ComputedOperationalDocumentTotals {
  if (lines.length === 0) {
    throw new DomainError("El documento debe tener al menos una linea.", "EMPTY_DOCUMENT_LINES");
  }

  const computedLines = lines.map<ComputedOperationalDocumentLine>((line) => {
    const quantity = new Decimal(line.quantity);
    const unitPrice = normalizeMoney(line.unitPrice);

    if (quantity.lte(0)) {
      throw new DomainError("La cantidad debe ser mayor a cero.", "INVALID_DOCUMENT_QUANTITY");
    }

    if (unitPrice.lt(0)) {
      throw new DomainError("El valor unitario no puede ser negativo.", "INVALID_DOCUMENT_UNIT_PRICE");
    }

    const lineSubtotal = normalizeMoney(quantity.mul(unitPrice));
    const taxAmount = line.tax ? calculateTax(lineSubtotal, line.tax.rate) : normalizeMoney(0);
    const isWithholding = Boolean(line.tax?.isWithholding);

    return {
      description: line.description.trim(),
      quantity,
      unitPrice,
      lineSubtotal,
      taxableBase: lineSubtotal,
      taxAmount,
      lineTotal: normalizeMoney(
        isWithholding ? lineSubtotal.minus(taxAmount) : lineSubtotal.plus(taxAmount),
      ),
      taxId: line.tax?.id ?? null,
      taxCode: line.tax?.code ?? null,
      isWithholding,
    };
  });

  const subtotal = sumMoney(computedLines.map((line) => line.lineSubtotal));
  const taxTotal = sumMoney(
    computedLines.filter((line) => !line.isWithholding).map((line) => line.taxAmount),
  );
  const withholdingTotal = sumMoney(
    computedLines.filter((line) => line.isWithholding).map((line) => line.taxAmount),
  );
  const total = normalizeMoney(subtotal.plus(taxTotal).minus(withholdingTotal));

  return {
    lines: computedLines,
    subtotal,
    taxTotal,
    withholdingTotal,
    total,
    balanceDue: total,
  };
}
