import test from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";

import { summarizePosting } from "@/modules/accounting/domain/services/posting-engine.service";
import {
  buildPurchaseBillPostingLines,
  buildSalesInvoicePostingLines,
} from "@/modules/accounting/domain/services/operational-posting.service";
import { computeOperationalDocumentTotals } from "@/modules/accounting/domain/services/operational-document-totals.service";

const postingAccounts = {
  accountsReceivableId: "1305",
  accountsPayableId: "2205",
  outputTaxId: "2408",
  inputTaxId: "1355",
  withholdingPayableId: "2365",
  withholdingReceivableId: "1365",
  bankId: "1110",
  cashId: "1105",
};

test("computeOperationalDocumentTotals separates VAT and withholdings", () => {
  const totals = computeOperationalDocumentTotals([
    {
      description: "Servicio base",
      quantity: "1.0000",
      unitPrice: "1000.00",
      tax: {
        id: "iva19",
        code: "IVA19",
        rate: new Decimal("19.0000"),
        isWithholding: false,
      },
    },
    {
      description: "Retefuente cliente",
      quantity: "1.0000",
      unitPrice: "1000.00",
      tax: {
        id: "retfte25",
        code: "RETFTE25",
        rate: new Decimal("2.5000"),
        isWithholding: true,
      },
    },
  ]);

  assert.equal(totals.subtotal.toString(), "2000");
  assert.equal(totals.taxTotal.toString(), "190");
  assert.equal(totals.withholdingTotal.toString(), "25");
  assert.equal(totals.total.toString(), "2165");
});

test("buildSalesInvoicePostingLines keeps sales entry balanced", () => {
  const posting = buildSalesInvoicePostingLines({
    accounts: postingAccounts,
    thirdPartyId: "customer-1",
    description: "Factura demo",
    total: "2165.00",
    taxTotal: "190.00",
    withholdingTotal: "25.00",
    lines: [
      {
        ledgerAccountId: "4135",
        description: "Servicio principal",
        lineSubtotal: "2000.00",
        taxAmount: "0.00",
        isWithholding: false,
      },
    ],
  });

  const totals = summarizePosting(posting);
  assert.equal(totals.totalDebit.toString(), "2190");
  assert.equal(totals.totalCredit.toString(), "2190");
});

test("buildPurchaseBillPostingLines keeps purchases entry balanced", () => {
  const posting = buildPurchaseBillPostingLines({
    accounts: postingAccounts,
    thirdPartyId: "supplier-1",
    description: "Factura proveedor demo",
    total: "1165.00",
    taxTotal: "190.00",
    withholdingTotal: "25.00",
    lines: [
      {
        ledgerAccountId: "5135",
        description: "Servicio tercero",
        lineSubtotal: "1000.00",
        taxAmount: "0.00",
        isWithholding: false,
      },
    ],
  });

  const totals = summarizePosting(posting);
  assert.equal(totals.totalDebit.toString(), "1190");
  assert.equal(totals.totalCredit.toString(), "1190");
});
