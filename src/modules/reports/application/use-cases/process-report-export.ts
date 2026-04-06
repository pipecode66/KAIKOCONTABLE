import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { buildReportExportFileName, serializeCsv } from "@/modules/reports/domain/services/report-export.service";
import {
  getAgingReport,
  getBalanceSheetReport,
  getCashFlowReport,
  getIncomeStatementReport,
  getPayablesReport,
  getReceivablesReport,
  getTrialBalanceReport,
} from "@/modules/reports/application/queries/get-reports-page-data";

type ProcessReportExportInput = {
  jobId: string;
  organizationId: string;
  correlationId?: string | null;
  payload: Record<string, unknown>;
};

function getRequiredString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing report export field: ${key}`);
  }
  return value;
}

export async function processReportExport(input: ProcessReportExportInput) {
  const reportKey = getRequiredString(input.payload, "reportKey");
  const asOf = typeof input.payload.asOf === "string" ? input.payload.asOf : undefined;
  const from = typeof input.payload.from === "string" ? input.payload.from : undefined;
  const to = typeof input.payload.to === "string" ? input.payload.to : undefined;

  let csvContent = "";
  let fileName = "";

  switch (reportKey) {
    case "balance-sheet": {
      const report = await getBalanceSheetReport({
        organizationId: input.organizationId,
        asOf: asOf!,
      });
      csvContent = serializeCsv(
        ["Seccion", "Codigo", "Cuenta", "Saldo"],
        report.sections.flatMap((section) =>
          section.rows.map((row) => [section.title, row.code, row.name, row.amount]),
        ),
      );
      fileName = buildReportExportFileName(reportKey, asOf!);
      break;
    }
    case "income-statement": {
      const report = await getIncomeStatementReport({
        organizationId: input.organizationId,
        from: from!,
        to: to!,
      });
      csvContent = serializeCsv(
        ["Seccion", "Codigo", "Cuenta", "Valor"],
        report.sections.flatMap((section) =>
          section.rows.map((row) => [section.title, row.code, row.name, row.amount]),
        ),
      );
      fileName = buildReportExportFileName(reportKey, `${from}-${to}`);
      break;
    }
    case "trial-balance": {
      const report = await getTrialBalanceReport({
        organizationId: input.organizationId,
        from: from!,
        to: to!,
      });
      csvContent = serializeCsv(
        ["Codigo", "Cuenta", "Apertura", "Debito", "Credito", "Cierre"],
        report.rows.map((row) => [
          row.code,
          row.name,
          row.openingBalance,
          row.periodDebit,
          row.periodCredit,
          row.closingBalance,
        ]),
      );
      fileName = buildReportExportFileName(reportKey, `${from}-${to}`);
      break;
    }
    case "receivables": {
      const result = await getReceivablesReport({
        organizationId: input.organizationId,
        asOf: asOf!,
        q: "",
        page: 1,
      });
      csvContent = serializeCsv(
        ["Documento", "Tercero", "Fecha", "Vencimiento", "Saldo", "Edad"],
        result.rows.map((row) => [
          row.documentNumber,
          row.thirdPartyName,
          row.issueDateIso.slice(0, 10),
          row.dueDateIso?.slice(0, 10) ?? "",
          row.balanceDue,
          row.ageDays,
        ]),
      );
      fileName = buildReportExportFileName(reportKey, asOf!);
      break;
    }
    case "payables": {
      const result = await getPayablesReport({
        organizationId: input.organizationId,
        asOf: asOf!,
        q: "",
        page: 1,
      });
      csvContent = serializeCsv(
        ["Documento", "Tercero", "Fecha", "Vencimiento", "Saldo", "Edad"],
        result.rows.map((row) => [
          row.documentNumber,
          row.thirdPartyName,
          row.issueDateIso.slice(0, 10),
          row.dueDateIso?.slice(0, 10) ?? "",
          row.balanceDue,
          row.ageDays,
        ]),
      );
      fileName = buildReportExportFileName(reportKey, asOf!);
      break;
    }
    case "aging-receivables":
    case "aging-payables": {
      const result = await getAgingReport({
        organizationId: input.organizationId,
        asOf: asOf!,
        q: "",
        page: 1,
        kind: reportKey === "aging-receivables" ? "RECEIVABLE" : "PAYABLE",
      });
      csvContent = serializeCsv(
        ["Bucket", "Total"],
        result.report.buckets.map((bucket) => [bucket.label, bucket.total]),
      );
      fileName = buildReportExportFileName(reportKey, asOf!);
      break;
    }
    case "cash-flow": {
      const report = await getCashFlowReport({
        organizationId: input.organizationId,
        from: from!,
        to: to!,
      });
      csvContent = serializeCsv(
        ["Tipo", "Fecha", "Etiqueta", "Contraparte", "Entrada", "Salida", "Movimiento interno"],
        report.rows.map((row) => [
          row.kind,
          row.dateIso.slice(0, 10),
          row.label,
          row.counterparty,
          row.inflow,
          row.outflow,
          row.internalAmount,
        ]),
      );
      fileName = buildReportExportFileName(reportKey, `${from}-${to}`);
      break;
    }
    default:
      throw new Error(`Unsupported report export: ${reportKey}`);
  }

  await prisma.asyncJob.update({
    where: {
      id: input.jobId,
    },
    data: {
      payload: {
        ...input.payload,
        csvContent,
        fileName,
        mimeType: "text/csv",
      },
    },
  });

  const requestedBy = typeof input.payload.requestedBy === "string" ? input.payload.requestedBy : undefined;
  if (requestedBy) {
    await writeAuditLog({
      organizationId: input.organizationId,
      actorUserId: requestedBy,
      action: "UPDATED",
      entityType: "ReportExport",
      entityId: input.jobId,
      correlationId: input.correlationId ?? null,
      afterState: {
        reportKey,
        fileName,
        status: "SUCCEEDED",
      },
    });
  }

  return {
    fileName,
    size: csvContent.length,
  };
}
