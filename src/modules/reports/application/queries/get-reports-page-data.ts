import Decimal from "decimal.js";

import { normalizeMoney, sumMoney } from "@/lib/money/money.service";
import type {
  AgingReportDto,
  BalanceSheetReportDto,
  CashFlowReportDto,
  IncomeStatementReportDto,
  OutstandingDocumentDto,
  ReportExportJobDto,
  ReportsOverviewDto,
  TrialBalanceReportDto,
} from "@/modules/reports/dto/reports.dto";
import { reportsRepository } from "@/modules/reports/infrastructure/repositories/reports.repository";

function toDateEnd(date: string) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function mapOutstandingRow(
  row: Awaited<ReturnType<typeof reportsRepository.listReceivables>>["rows"][number] | Awaited<ReturnType<typeof reportsRepository.listPayables>>["rows"][number],
): OutstandingDocumentDto {
  return {
    id: row.id,
    sourceType: row.sourceType,
    documentNumber: row.documentNumber,
    thirdPartyName: row.thirdPartyName,
    issueDateIso: row.issueDate.toISOString(),
    dueDateIso: row.dueDate?.toISOString() ?? null,
    total: row.total.toString(),
    balanceDue: row.balanceDue.toString(),
    ageDays: row.ageDays,
  };
}

export async function getBalanceSheetReport(input: {
  organizationId: string;
  asOf: string;
}): Promise<BalanceSheetReportDto> {
  const asOf = toDateEnd(input.asOf);
  const rows = await reportsRepository.listLedgerBalancesAsOf(input.organizationId, asOf);

  const assets = rows.filter((row) => row.type === "ASSET" && !row.balance.equals(0));
  const liabilities = rows.filter((row) => row.type === "LIABILITY" && !row.balance.equals(0));
  const equity = rows.filter((row) => row.type === "EQUITY" && !row.balance.equals(0));

  const totalAssets = sumMoney(assets.map((row) => row.balance));
  const totalLiabilitiesAndEquity = sumMoney([...liabilities, ...equity].map((row) => row.balance));

  return {
    asOfIso: asOf.toISOString(),
    sections: [
      {
        key: "assets",
        title: "Activos",
        total: totalAssets.toString(),
        rows: assets.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.balance.toString(),
        })),
      },
      {
        key: "liabilities",
        title: "Pasivos",
        total: sumMoney(liabilities.map((row) => row.balance)).toString(),
        rows: liabilities.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.balance.toString(),
        })),
      },
      {
        key: "equity",
        title: "Patrimonio",
        total: sumMoney(equity.map((row) => row.balance)).toString(),
        rows: equity.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.balance.toString(),
        })),
      },
    ],
    totalAssets: totalAssets.toString(),
    totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toString(),
  };
}

export async function getIncomeStatementReport(input: {
  organizationId: string;
  from: string;
  to: string;
}): Promise<IncomeStatementReportDto> {
  const from = new Date(`${input.from}T00:00:00.000Z`);
  const to = toDateEnd(input.to);
  const accounts = await reportsRepository.listTrialBalanceSource(input.organizationId, to);

  const movements = accounts.map((account) => {
    const periodLines = account.journalLines.filter((line) => {
      const entryDate = line.journalEntry.entryDate;
      return entryDate >= from && entryDate <= to;
    });

    const totalDebit = sumMoney(periodLines.map((line) => line.debit));
    const totalCredit = sumMoney(periodLines.map((line) => line.credit));
    const amount =
      account.normalBalance === "DEBIT"
        ? totalDebit.minus(totalCredit)
        : totalCredit.minus(totalDebit);

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      amount: normalizeMoney(amount),
    };
  });

  const revenue = movements.filter((row) => row.type === "REVENUE" && !row.amount.equals(0));
  const costOfSales = movements.filter((row) => row.type === "COST_OF_SALES" && !row.amount.equals(0));
  const expenses = movements.filter((row) => row.type === "EXPENSE" && !row.amount.equals(0));

  const revenueTotal = sumMoney(revenue.map((row) => row.amount));
  const costOfSalesTotal = sumMoney(costOfSales.map((row) => row.amount));
  const expenseTotal = sumMoney(expenses.map((row) => row.amount));
  const grossProfit = normalizeMoney(revenueTotal.minus(costOfSalesTotal));
  const netIncome = normalizeMoney(grossProfit.minus(expenseTotal));

  return {
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    sections: [
      {
        key: "revenue",
        title: "Ingresos",
        total: revenueTotal.toString(),
        rows: revenue.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.amount.toString(),
        })),
      },
      {
        key: "cost-of-sales",
        title: "Costo de ventas",
        total: costOfSalesTotal.toString(),
        rows: costOfSales.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.amount.toString(),
        })),
      },
      {
        key: "expenses",
        title: "Gastos",
        total: expenseTotal.toString(),
        rows: expenses.map((row) => ({
          accountId: row.id,
          code: row.code,
          name: row.name,
          type: row.type,
          normalBalance: row.normalBalance,
          amount: row.amount.toString(),
        })),
      },
    ],
    grossProfit: grossProfit.toString(),
    netIncome: netIncome.toString(),
  };
}

export async function getTrialBalanceReport(input: {
  organizationId: string;
  from: string;
  to: string;
}): Promise<TrialBalanceReportDto> {
  const from = new Date(`${input.from}T00:00:00.000Z`);
  const to = toDateEnd(input.to);
  const accounts = await reportsRepository.listTrialBalanceSource(input.organizationId, to);

  const rows = accounts
    .map((account) => {
      const openingLines = account.journalLines.filter((line) => line.journalEntry.entryDate < from);
      const periodLines = account.journalLines.filter((line) => {
        const entryDate = line.journalEntry.entryDate;
        return entryDate >= from && entryDate <= to;
      });

      const openingDebit = sumMoney(openingLines.map((line) => line.debit));
      const openingCredit = sumMoney(openingLines.map((line) => line.credit));
      const periodDebit = sumMoney(periodLines.map((line) => line.debit));
      const periodCredit = sumMoney(periodLines.map((line) => line.credit));
      const openingBalance =
        account.normalBalance === "DEBIT"
          ? openingDebit.minus(openingCredit)
          : openingCredit.minus(openingDebit);
      const movementBalance =
        account.normalBalance === "DEBIT"
          ? periodDebit.minus(periodCredit)
          : periodCredit.minus(periodDebit);
      const closingBalance = normalizeMoney(openingBalance.plus(movementBalance));

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        openingBalance: normalizeMoney(openingBalance),
        periodDebit,
        periodCredit,
        closingBalance,
      };
    })
    .filter(
      (row) =>
        !row.openingBalance.equals(0) ||
        !row.periodDebit.equals(0) ||
        !row.periodCredit.equals(0) ||
        !row.closingBalance.equals(0),
    );

  return {
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    rows: rows.map((row) => ({
      ...row,
      openingBalance: row.openingBalance.toString(),
      periodDebit: row.periodDebit.toString(),
      periodCredit: row.periodCredit.toString(),
      closingBalance: row.closingBalance.toString(),
    })),
    totals: {
      openingBalance: sumMoney(rows.map((row) => row.openingBalance)).toString(),
      periodDebit: sumMoney(rows.map((row) => row.periodDebit)).toString(),
      periodCredit: sumMoney(rows.map((row) => row.periodCredit)).toString(),
      closingBalance: sumMoney(rows.map((row) => row.closingBalance)).toString(),
    },
  };
}

export async function getReceivablesReport(input: {
  organizationId: string;
  asOf: string;
  q: string;
  page: number;
}) {
  const result = await reportsRepository.listReceivables({
    organizationId: input.organizationId,
    asOf: toDateEnd(input.asOf),
    q: input.q,
    page: input.page,
  });

  return {
    totalItems: result.totalItems,
    rows: result.rows.map(mapOutstandingRow),
  };
}

export async function getPayablesReport(input: {
  organizationId: string;
  asOf: string;
  q: string;
  page: number;
}) {
  const result = await reportsRepository.listPayables({
    organizationId: input.organizationId,
    asOf: toDateEnd(input.asOf),
    q: input.q,
    page: input.page,
  });

  return {
    totalItems: result.totalItems,
    rows: result.rows.map(mapOutstandingRow),
  };
}

export async function getAgingReport(input: {
  organizationId: string;
  asOf: string;
  q: string;
  page: number;
  kind: "RECEIVABLE" | "PAYABLE";
}): Promise<{
  totalItems: number;
  report: AgingReportDto;
}> {
  const asOf = toDateEnd(input.asOf);
  const result =
    input.kind === "RECEIVABLE"
      ? await reportsRepository.listReceivables({
          organizationId: input.organizationId,
          asOf,
          q: input.q,
          page: input.page,
        })
      : await reportsRepository.listPayables({
          organizationId: input.organizationId,
          asOf,
          q: input.q,
          page: input.page,
        });

  const allRows = "allRows" in result ? result.allRows : result.rows;
  const bucketTotals = reportsRepository.bucketizeOutstanding(allRows);

  return {
    totalItems: result.totalItems,
    report: {
      asOfIso: asOf.toISOString(),
      kind: input.kind,
      buckets: [
        { key: "current", label: "Corriente", total: bucketTotals.current.toString() },
        { key: "1-30", label: "1 - 30 dias", total: bucketTotals["1-30"].toString() },
        { key: "31-60", label: "31 - 60 dias", total: bucketTotals["31-60"].toString() },
        { key: "61-90", label: "61 - 90 dias", total: bucketTotals["61-90"].toString() },
        { key: "91+", label: "91+ dias", total: bucketTotals["91+"].toString() },
      ],
      rows: result.rows.map(mapOutstandingRow),
    },
  };
}

export async function getCashFlowReport(input: {
  organizationId: string;
  from: string;
  to: string;
}): Promise<CashFlowReportDto> {
  const from = new Date(`${input.from}T00:00:00.000Z`);
  const to = toDateEnd(input.to);
  const { payments, transfers } = await reportsRepository.listCashFlowMovements(input.organizationId, from, to);

  const operatingInflows = sumMoney(
    payments.filter((payment) => payment.direction === "RECEIVED").map((payment) => payment.amount),
  );
  const operatingOutflows = sumMoney(
    payments.filter((payment) => payment.direction === "SENT").map((payment) => payment.amount),
  );
  const internalTransfers = sumMoney(transfers.map((transfer) => transfer.amount));
  const netCashChange = normalizeMoney(operatingInflows.minus(operatingOutflows));

  return {
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    operatingInflows: operatingInflows.toString(),
    operatingOutflows: operatingOutflows.toString(),
    internalTransfers: internalTransfers.toString(),
    netCashChange: netCashChange.toString(),
    rows: [
      ...payments.map((payment) => ({
        id: payment.id,
        kind: payment.direction === "RECEIVED" ? ("INFLOW" as const) : ("OUTFLOW" as const),
        dateIso: payment.paymentDate.toISOString(),
        label: payment.reference ?? `Pago ${payment.id.slice(-6)}`,
        counterparty: payment.thirdParty?.name ?? "Sin tercero",
        inflow: payment.direction === "RECEIVED" ? payment.amount.toString() : "0.00",
        outflow: payment.direction === "SENT" ? payment.amount.toString() : "0.00",
        internalAmount: "0.00",
      })),
      ...transfers.map((transfer) => ({
        id: transfer.id,
        kind: "INTERNAL_TRANSFER" as const,
        dateIso: transfer.transferDate.toISOString(),
        label: transfer.reference ?? `Traslado ${transfer.id.slice(-6)}`,
        counterparty: `${transfer.sourceBankAccount?.name ?? transfer.sourceCashAccount?.name ?? "Origen"} -> ${
          transfer.destinationBankAccount?.name ?? transfer.destinationCashAccount?.name ?? "Destino"
        }`,
        inflow: "0.00",
        outflow: "0.00",
        internalAmount: transfer.amount.toString(),
      })),
    ].sort((left, right) => left.dateIso.localeCompare(right.dateIso)),
  };
}

export async function getReportsOverview(input: {
  organizationId: string;
}): Promise<ReportsOverviewDto> {
  const today = new Date();
  const [balanceSheet, incomeStatement, receivables, payables, exports] = await Promise.all([
    getBalanceSheetReport({
      organizationId: input.organizationId,
      asOf: today.toISOString().slice(0, 10),
    }),
    getIncomeStatementReport({
      organizationId: input.organizationId,
      from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    }),
    reportsRepository.sumOpenReceivables(input.organizationId),
    reportsRepository.sumOpenPayables(input.organizationId),
    reportsRepository.listReportExports({
      organizationId: input.organizationId,
      page: 1,
    }),
  ]);

  const sectionTotal = (key: string) =>
    balanceSheet.sections.find((section) => section.key === key)?.total ?? "0.00";

  const monthlyExpenses = incomeStatement.sections
    .filter((section) => section.key === "expenses" || section.key === "cost-of-sales")
    .reduce((acc, section) => acc.plus(section.total), new Decimal(0));

  return {
    metrics: {
      assets: sectionTotal("assets"),
      liabilities: sectionTotal("liabilities"),
      equity: sectionTotal("equity"),
      monthlyRevenue: incomeStatement.sections.find((section) => section.key === "revenue")?.total ?? "0.00",
      monthlyExpenses: normalizeMoney(monthlyExpenses).toString(),
      openReceivables: receivables.toString(),
      openPayables: payables.toString(),
    },
    exportQueue: {
      pending: exports.rows.filter((job) => ["PENDING", "RUNNING", "RETRYING"].includes(job.status)).length,
      completed: exports.rows.filter((job) => job.status === "SUCCEEDED").length,
    },
  };
}

export async function getReportExportsPageData(input: {
  organizationId: string;
  page: number;
}): Promise<{
  totalItems: number;
  rows: ReportExportJobDto[];
}> {
  const result = await reportsRepository.listReportExports(input);

  return {
    totalItems: result.totalItems,
    rows: result.rows.map((row) => {
      const payload = row.payload as Record<string, unknown>;
      const fileName = typeof payload.fileName === "string" ? payload.fileName : null;
      const canDownload = row.status === "SUCCEEDED" && typeof payload.csvContent === "string";
      return {
        id: row.id,
        type: row.type,
        status: row.status,
        createdAtIso: row.createdAt.toISOString(),
        updatedAtIso: row.updatedAt.toISOString(),
        fileName,
        downloadUrl: canDownload ? `/api/reports/exports/${row.id}` : null,
        lastError: row.lastError,
      };
    }),
  };
}
