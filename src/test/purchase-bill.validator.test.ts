import assert from "node:assert/strict";
import test from "node:test";

import { purchaseBillFormSchema } from "@/modules/purchases/validators/purchase-bill.validator";

test("purchaseBillFormSchema accepts a valid draft payload", () => {
  const parsed = purchaseBillFormSchema.parse({
    supplierId: "supplier-1",
    issueDate: "2026-04-01",
    dueDate: "2026-04-30",
    notes: "Factura de servicios",
    lines: [
      {
        description: "Servicio mensual",
        quantity: "1.0000",
        unitPrice: "2500000.00",
        accountId: "account-1",
        taxId: "tax-1",
      },
    ],
  });

  assert.equal(parsed.lines.length, 1);
  assert.equal(parsed.lines[0]?.description, "Servicio mensual");
});

test("purchaseBillFormSchema rejects a bill without lines", () => {
  assert.throws(() =>
    purchaseBillFormSchema.parse({
      supplierId: "supplier-1",
      issueDate: "2026-04-01",
      lines: [],
    }),
  );
});
