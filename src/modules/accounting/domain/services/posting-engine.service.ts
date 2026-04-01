import Decimal from "decimal.js";
import type { JournalEntryType, JournalSourceType, VoucherType } from "@prisma/client";

import { normalizeMoney, sumMoney } from "@/lib/money/money.service";
import { assertBalancedEntry } from "@/modules/accounting/domain/rules/journal-entry-balance.rule";

export type PostingLine = {
  ledgerAccountId: string;
  thirdPartyId?: string | null;
  costCenterId?: string | null;
  description?: string | null;
  debit: Decimal.Value;
  credit: Decimal.Value;
};

export type PostingVoucherSnapshot = {
  organizationId: string;
  accountingPeriodId: string | null;
  currencyId: string;
  entryDate: Date;
  sourceType: JournalSourceType;
  sourceId: string;
  description: string;
  voucherType: VoucherType;
  lines: PostingLine[];
};

export function summarizePosting(lines: PostingLine[]) {
  const totalDebit = sumMoney(lines.map((line) => line.debit));
  const totalCredit = sumMoney(lines.map((line) => line.credit));

  assertBalancedEntry(totalDebit.toString(), totalCredit.toString());

  return {
    totalDebit: normalizeMoney(totalDebit),
    totalCredit: normalizeMoney(totalCredit),
  };
}

export function resolveJournalEntryType(voucherType: VoucherType): JournalEntryType {
  switch (voucherType) {
    case "OPENING_BALANCE":
      return "OPENING_BALANCE";
    case "PERIOD_CLOSING":
      return "PERIOD_CLOSING";
    default:
      return "MANUAL_ADJUSTMENT";
  }
}

export function buildJournalEntryFromVoucher(input: PostingVoucherSnapshot) {
  const totals = summarizePosting(input.lines);

  return {
    organizationId: input.organizationId,
    accountingPeriodId: input.accountingPeriodId,
    currencyId: input.currencyId,
    entryDate: input.entryDate,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    entryType: resolveJournalEntryType(input.voucherType),
    description: input.description,
    totalDebit: totals.totalDebit,
    totalCredit: totals.totalCredit,
    lines: input.lines.map((line) => ({
      ledgerAccountId: line.ledgerAccountId,
      thirdPartyId: line.thirdPartyId ?? null,
      costCenterId: line.costCenterId ?? null,
      description: line.description ?? null,
      debit: normalizeMoney(line.debit),
      credit: normalizeMoney(line.credit),
    })),
  };
}
