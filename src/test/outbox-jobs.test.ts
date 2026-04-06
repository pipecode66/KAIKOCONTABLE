import assert from "node:assert/strict";
import test from "node:test";

import { translateOutboxMessage } from "@/lib/outbox/outbox.translator";

test("translateOutboxMessage maps statement imports to processing jobs", () => {
  const result = translateOutboxMessage({
    eventType: "treasury.statement_import.requested",
    payload: {
      importId: "import-1",
    },
    dedupeKey: "treasury:statement-import:requested:import-1",
  });

  assert.equal(result.kind, "job");
  if (result.kind === "job") {
    assert.equal(result.type, "treasury.statement_import.process");
    assert.equal(result.dedupeKey, "outbox:treasury:statement-import:requested:import-1");
  }
});

test("translateOutboxMessage leaves non-job domain events as internal events", () => {
  const result = translateOutboxMessage({
    eventType: "sales.invoice.posted",
    payload: {
      invoiceId: "fv-1",
    },
    dedupeKey: "sales:invoice:posted:fv-1",
  });

  assert.equal(result.kind, "event");
});
