import Decimal from "decimal.js";

import { calculateTax, normalizeMoney } from "@/lib/money/money.service";

type TaxableLine = {
  base: Decimal.Value;
  rate: Decimal.Value;
};

export function calculateTaxBreakdown(lines: TaxableLine[]) {
  return lines.map((line) => {
    const base = normalizeMoney(line.base);
    const amount = calculateTax(base, line.rate);

    return {
      base,
      rate: new Decimal(line.rate),
      amount,
    };
  });
}
