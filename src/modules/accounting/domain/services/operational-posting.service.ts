import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";
import { normalizeMoney } from "@/lib/money/money.service";
import type { PostingLine } from "@/modules/accounting/domain/services/posting-engine.service";

export type OperationalPostingAccounts = {
  accountsReceivableId: string;
  accountsPayableId: string;
  outputTaxId: string;
  inputTaxId: string;
  withholdingPayableId: string;
  withholdingReceivableId: string;
  bankId: string;
  cashId: string;
};

export type OperationalPostingDocumentLine = {
  ledgerAccountId: string;
  description: string;
  lineSubtotal: Decimal.Value;
  taxAmount: Decimal.Value;
  isWithholding: boolean;
};

function ensureAccountId(value: string | null | undefined, description: string) {
  if (!value) {
    throw new DomainError(description, "MISSING_POSTING_ACCOUNT");
  }

  return value;
}

export function buildSalesInvoicePostingLines(input: {
  accounts: OperationalPostingAccounts;
  thirdPartyId: string;
  description: string;
  total: Decimal.Value;
  withholdingTotal: Decimal.Value;
  taxTotal: Decimal.Value;
  lines: OperationalPostingDocumentLine[];
}): PostingLine[] {
  const postingLines: PostingLine[] = [
    {
      ledgerAccountId: input.accounts.accountsReceivableId,
      thirdPartyId: input.thirdPartyId,
      description: `CxC ${input.description}`,
      debit: normalizeMoney(input.total),
      credit: normalizeMoney(0),
    },
  ];

  const withholdingTotal = normalizeMoney(input.withholdingTotal);
  if (withholdingTotal.gt(0)) {
    postingLines.push({
      ledgerAccountId: input.accounts.withholdingReceivableId,
      thirdPartyId: input.thirdPartyId,
      description: `Retencion cliente ${input.description}`,
      debit: withholdingTotal,
      credit: normalizeMoney(0),
    });
  }

  for (const line of input.lines) {
    postingLines.push({
      ledgerAccountId: ensureAccountId(
        line.ledgerAccountId,
        "Cada linea de venta debe tener una cuenta contable para publicar.",
      ),
      thirdPartyId: input.thirdPartyId,
      description: line.description,
      debit: normalizeMoney(0),
      credit: normalizeMoney(line.lineSubtotal),
    });
  }

  const taxTotal = normalizeMoney(input.taxTotal);
  if (taxTotal.gt(0)) {
    postingLines.push({
      ledgerAccountId: input.accounts.outputTaxId,
      thirdPartyId: input.thirdPartyId,
      description: `IVA generado ${input.description}`,
      debit: normalizeMoney(0),
      credit: taxTotal,
    });
  }

  return postingLines;
}

export function buildPurchaseBillPostingLines(input: {
  accounts: OperationalPostingAccounts;
  thirdPartyId?: string | null;
  description: string;
  total: Decimal.Value;
  taxTotal: Decimal.Value;
  withholdingTotal: Decimal.Value;
  lines: OperationalPostingDocumentLine[];
}): PostingLine[] {
  const postingLines: PostingLine[] = [];

  for (const line of input.lines) {
    postingLines.push({
      ledgerAccountId: ensureAccountId(
        line.ledgerAccountId,
        "Cada linea de compra debe tener una cuenta contable para publicar.",
      ),
      thirdPartyId: input.thirdPartyId,
      description: line.description,
      debit: normalizeMoney(line.lineSubtotal),
      credit: normalizeMoney(0),
    });
  }

  const taxTotal = normalizeMoney(input.taxTotal);
  if (taxTotal.gt(0)) {
    postingLines.push({
      ledgerAccountId: input.accounts.inputTaxId,
      thirdPartyId: input.thirdPartyId,
      description: `IVA descontable ${input.description}`,
      debit: taxTotal,
      credit: normalizeMoney(0),
    });
  }

  const withholdingTotal = normalizeMoney(input.withholdingTotal);
  if (withholdingTotal.gt(0)) {
    postingLines.push({
      ledgerAccountId: input.accounts.withholdingPayableId,
      thirdPartyId: input.thirdPartyId,
      description: `Retencion por pagar ${input.description}`,
      debit: normalizeMoney(0),
      credit: withholdingTotal,
    });
  }

  postingLines.push({
    ledgerAccountId: input.accounts.accountsPayableId,
    thirdPartyId: input.thirdPartyId,
    description: `CxP ${input.description}`,
    debit: normalizeMoney(0),
    credit: normalizeMoney(input.total),
  });

  return postingLines;
}

export function buildExpensePostingLines(input: {
  accounts: OperationalPostingAccounts;
  thirdPartyId?: string | null;
  description: string;
  total: Decimal.Value;
  taxTotal: Decimal.Value;
  withholdingTotal: Decimal.Value;
  lines: OperationalPostingDocumentLine[];
}): PostingLine[] {
  return buildPurchaseBillPostingLines({
    accounts: input.accounts,
    thirdPartyId: input.thirdPartyId ?? null,
    description: input.description,
    total: input.total,
    taxTotal: input.taxTotal,
    withholdingTotal: input.withholdingTotal,
    lines: input.lines,
  }).map((line) => ({
    ...line,
    thirdPartyId: input.thirdPartyId ?? null,
  }));
}

export function buildPaymentPostingLines(input: {
  accounts: OperationalPostingAccounts;
  thirdPartyId?: string | null;
  description: string;
  direction: "RECEIVED" | "SENT";
  amount: Decimal.Value;
  toBank: boolean;
}): PostingLine[] {
  const treasuryLedgerAccountId = input.toBank ? input.accounts.bankId : input.accounts.cashId;
  const amount = normalizeMoney(input.amount);

  if (input.direction === "RECEIVED") {
    return [
      {
        ledgerAccountId: treasuryLedgerAccountId,
        thirdPartyId: input.thirdPartyId ?? null,
        description: `Ingreso tesoreria ${input.description}`,
        debit: amount,
        credit: normalizeMoney(0),
      },
      {
        ledgerAccountId: input.accounts.accountsReceivableId,
        thirdPartyId: input.thirdPartyId ?? null,
        description: `Aplicacion cartera ${input.description}`,
        debit: normalizeMoney(0),
        credit: amount,
      },
    ];
  }

  return [
    {
      ledgerAccountId: input.accounts.accountsPayableId,
      thirdPartyId: input.thirdPartyId ?? null,
      description: `Aplicacion obligaciones ${input.description}`,
      debit: amount,
      credit: normalizeMoney(0),
    },
    {
      ledgerAccountId: treasuryLedgerAccountId,
      thirdPartyId: input.thirdPartyId ?? null,
      description: `Salida tesoreria ${input.description}`,
      debit: normalizeMoney(0),
      credit: amount,
    },
  ];
}

export function buildTransferPostingLines(input: {
  accounts: OperationalPostingAccounts;
  description: string;
  amount: Decimal.Value;
  sourceType: "BANK" | "CASH";
  destinationType: "BANK" | "CASH";
}): PostingLine[] {
  const sourceLedgerAccountId =
    input.sourceType === "BANK" ? input.accounts.bankId : input.accounts.cashId;
  const destinationLedgerAccountId =
    input.destinationType === "BANK" ? input.accounts.bankId : input.accounts.cashId;

  return [
    {
      ledgerAccountId: destinationLedgerAccountId,
      description: `Ingreso traslado ${input.description}`,
      debit: normalizeMoney(input.amount),
      credit: normalizeMoney(0),
    },
    {
      ledgerAccountId: sourceLedgerAccountId,
      description: `Salida traslado ${input.description}`,
      debit: normalizeMoney(0),
      credit: normalizeMoney(input.amount),
    },
  ];
}
