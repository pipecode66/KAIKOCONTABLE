import assert from "node:assert/strict";
import test from "node:test";

import { buildReportExportFileName, serializeCsv } from "@/modules/reports/domain/services/report-export.service";

test("serializeCsv escapes commas and quotes", () => {
  const csv = serializeCsv(["Cuenta", "Valor"], [["Caja, principal", '"1200"']]);
  assert.equal(csv, 'Cuenta,Valor\n"Caja, principal","""1200"""');
});

test("buildReportExportFileName keeps deterministic export names", () => {
  assert.equal(
    buildReportExportFileName("balance-sheet", "2026-04-06"),
    "kaiko-balance-sheet-2026-04-06.csv",
  );
});
