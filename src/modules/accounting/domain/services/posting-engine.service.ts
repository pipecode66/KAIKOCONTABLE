import Decimal from "decimal.js";

import { assertBalancedEntry } from "@/modules/accounting/domain/rules/journal-entry-balance.rule";

type PostingLine = {
  debit: Decimal.Value;
  credit: Decimal.Value;
};

export function summarizePosting(lines: PostingLine[]) {
  const totals = lines.reduce<{ debit: Decimal; credit: Decimal }>(
    (acc, line) => {
      acc.debit = acc.debit.plus(new Decimal(line.debit));
      acc.credit = acc.credit.plus(new Decimal(line.credit));
      return acc;
    },
    {
      debit: new Decimal(0),
      credit: new Decimal(0),
    },
  );

  assertBalancedEntry(totals.debit.toNumber(), totals.credit.toNumber());

  return totals;
}
