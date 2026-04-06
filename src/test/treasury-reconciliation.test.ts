import assert from "node:assert/strict";
import test from "node:test";

import { buildReconciliationSuggestions } from "@/modules/treasury/domain/services/reconciliation.service";

test("buildReconciliationSuggestions prioritizes exact reference matches", () => {
  const suggestions = buildReconciliationSuggestions({
    statementLines: [
      {
        id: "line-1",
        transactionDate: new Date("2026-04-03T12:00:00.000Z"),
        description: "Recaudo cliente",
        reference: "RC-0005",
        amount: "1500.00",
      },
    ],
    payments: [
      {
        id: "payment-1",
        paymentDate: new Date("2026-04-03T10:00:00.000Z"),
        reference: "RC-0005",
        direction: "RECEIVED",
        amount: "1500.00",
        thirdPartyName: "Cliente Demo",
      },
      {
        id: "payment-2",
        paymentDate: new Date("2026-04-04T10:00:00.000Z"),
        reference: "OTRO",
        direction: "RECEIVED",
        amount: "1500.00",
        thirdPartyName: "Cliente Secundario",
      },
    ],
    outgoingTransfers: [],
    incomingTransfers: [],
  });

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.matchedDocumentType, "PAYMENT");
  assert.equal(suggestions[0]?.matchedDocumentId, "payment-1");
  assert.equal(suggestions[0]?.confidence, "high");
});

test("buildReconciliationSuggestions supports outgoing signed movements", () => {
  const suggestions = buildReconciliationSuggestions({
    statementLines: [
      {
        id: "line-2",
        transactionDate: new Date("2026-04-05T12:00:00.000Z"),
        description: "Pago proveedor",
        reference: null,
        amount: "-980.00",
      },
    ],
    payments: [
      {
        id: "payment-3",
        paymentDate: new Date("2026-04-05T09:00:00.000Z"),
        reference: "EGR-980",
        direction: "SENT",
        amount: "980.00",
        thirdPartyName: "Proveedor Uno",
      },
    ],
    outgoingTransfers: [],
    incomingTransfers: [],
  });

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.matchedAmount, "-980");
  assert.equal(suggestions[0]?.matchedDocumentId, "payment-3");
});
