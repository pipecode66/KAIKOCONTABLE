import test from "node:test";
import assert from "node:assert/strict";

import { DomainError } from "@/lib/errors";
import {
  buildIdempotencyRequestHash,
  resolveIdempotencyState,
} from "@/lib/idempotency/idempotency.service";
import { assertBalancedEntry } from "@/modules/accounting/domain/rules/journal-entry-balance.rule";
import {
  buildJournalEntryFromVoucher,
  summarizePosting,
} from "@/modules/accounting/domain/services/posting-engine.service";
import { buildReversalLines } from "@/modules/accounting/domain/services/reversal.service";
import { formatSequenceNumber } from "@/modules/accounting/domain/services/sequence.service";

test("summarizePosting keeps manual vouchers balanced", () => {
  const totals = summarizePosting([
    {
      ledgerAccountId: "a",
      debit: "1500.00",
      credit: "0.00",
    },
    {
      ledgerAccountId: "b",
      debit: "0.00",
      credit: "1500.00",
    },
  ]);

  assert.equal(totals.totalDebit.toString(), "1500");
  assert.equal(totals.totalCredit.toString(), "1500");
});

test("assertBalancedEntry rejects unbalanced postings", () => {
  assert.throws(
    () => assertBalancedEntry("100.00", "90.00"),
    (error) => error instanceof DomainError && error.code === "UNBALANCED_JOURNAL_ENTRY",
  );
});

test("buildJournalEntryFromVoucher preserves balanced totals", () => {
  const entry = buildJournalEntryFromVoucher({
    organizationId: "org",
    accountingPeriodId: "period",
    currencyId: "cop",
    entryDate: new Date("2026-03-25T12:00:00.000Z"),
    sourceType: "ACCOUNTING_VOUCHER",
    sourceId: "voucher-1",
    description: "Ajuste prueba",
    voucherType: "MANUAL_ADJUSTMENT",
    lines: [
      {
        ledgerAccountId: "cash",
        debit: "1000.00",
        credit: "0.00",
      },
      {
        ledgerAccountId: "equity",
        debit: "0.00",
        credit: "1000.00",
      },
    ],
  });

  assert.equal(entry.totalDebit.toString(), "1000");
  assert.equal(entry.totalCredit.toString(), "1000");
  assert.equal(entry.lines.length, 2);
});

test("buildReversalLines swaps debits and credits", () => {
  const reversal = buildReversalLines([
    {
      ledgerAccountId: "cash",
      debit: "1000.00",
      credit: "0.00",
    },
    {
      ledgerAccountId: "expense",
      debit: "0.00",
      credit: "1000.00",
    },
  ]);

  assert.equal(reversal[0].debit.toString(), "0");
  assert.equal(reversal[0].credit.toString(), "1000");
  assert.equal(reversal[1].debit.toString(), "1000");
  assert.equal(reversal[1].credit.toString(), "0");
});

test("formatSequenceNumber keeps deterministic numbering", () => {
  const value = formatSequenceNumber({
    prefix: "JE",
    currentNumber: 27,
    padding: 6,
  });

  assert.equal(value, "JE-000027");
});

test("resolveIdempotencyState replays matching completed records", () => {
  const requestHash = buildIdempotencyRequestHash({ voucherId: "1", version: 2 });
  const state = resolveIdempotencyState(
    {
      status: "COMPLETED",
      requestHash,
      responseBody: { voucherId: "1" },
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    },
    requestHash,
  );

  assert.equal(state.type, "replay");
});

test("resolveIdempotencyState blocks same key with different payload", () => {
  const state = resolveIdempotencyState(
    {
      status: "COMPLETED",
      requestHash: buildIdempotencyRequestHash({ voucherId: "1" }),
      responseBody: { voucherId: "1" },
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    },
    buildIdempotencyRequestHash({ voucherId: "2" }),
  );

  assert.equal(state.type, "conflict");
});

test("resolveIdempotencyState blocks concurrent in-progress retry", () => {
  const requestHash = buildIdempotencyRequestHash({ journalEntryId: "je-1" });
  const state = resolveIdempotencyState(
    {
      status: "IN_PROGRESS",
      requestHash,
      responseBody: null,
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    },
    requestHash,
  );

  assert.equal(state.type, "conflict");
});
