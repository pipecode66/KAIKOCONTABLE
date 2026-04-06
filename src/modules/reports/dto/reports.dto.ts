import type { CatalogPagination, CatalogActionResult } from "@/modules/shared/dto/catalog-management.dto";

export type ReportBalanceRowDto = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  normalBalance: "DEBIT" | "CREDIT";
  amount: string;
};

export type ReportSectionDto = {
  key: string;
  title: string;
  total: string;
  rows: ReportBalanceRowDto[];
};

export type BalanceSheetReportDto = {
  asOfIso: string;
  sections: ReportSectionDto[];
  totalAssets: string;
  totalLiabilitiesAndEquity: string;
};

export type IncomeStatementReportDto = {
  fromIso: string;
  toIso: string;
  sections: ReportSectionDto[];
  grossProfit: string;
  netIncome: string;
};

export type TrialBalanceRowDto = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  openingBalance: string;
  periodDebit: string;
  periodCredit: string;
  closingBalance: string;
};

export type TrialBalanceReportDto = {
  fromIso: string;
  toIso: string;
  rows: TrialBalanceRowDto[];
  totals: {
    openingBalance: string;
    periodDebit: string;
    periodCredit: string;
    closingBalance: string;
  };
};

export type OutstandingDocumentDto = {
  id: string;
  sourceType: "SALES_INVOICE" | "PURCHASE_BILL" | "EXPENSE";
  documentNumber: string;
  thirdPartyName: string;
  issueDateIso: string;
  dueDateIso: string | null;
  total: string;
  balanceDue: string;
  ageDays: number;
};

export type AgingBucketDto = {
  key: "current" | "1-30" | "31-60" | "61-90" | "91+";
  label: string;
  total: string;
};

export type AgingReportDto = {
  asOfIso: string;
  kind: "RECEIVABLE" | "PAYABLE";
  buckets: AgingBucketDto[];
  rows: OutstandingDocumentDto[];
};

export type CashFlowRowDto = {
  id: string;
  kind: "INFLOW" | "OUTFLOW" | "INTERNAL_TRANSFER";
  dateIso: string;
  label: string;
  counterparty: string;
  inflow: string;
  outflow: string;
  internalAmount: string;
};

export type CashFlowReportDto = {
  fromIso: string;
  toIso: string;
  operatingInflows: string;
  operatingOutflows: string;
  internalTransfers: string;
  netCashChange: string;
  rows: CashFlowRowDto[];
};

export type ReportsOverviewDto = {
  metrics: {
    assets: string;
    liabilities: string;
    equity: string;
    monthlyRevenue: string;
    monthlyExpenses: string;
    openReceivables: string;
    openPayables: string;
  };
  exportQueue: {
    pending: number;
    completed: number;
  };
};

export type ReportExportRequestInput = {
  reportKey:
    | "balance-sheet"
    | "income-statement"
    | "trial-balance"
    | "receivables"
    | "payables"
    | "aging-receivables"
    | "aging-payables"
    | "cash-flow";
  asOf?: string;
  from?: string;
  to?: string;
};

export type ReportExportJobDto = {
  id: string;
  type: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "RETRYING"
    | "SUCCEEDED"
    | "FAILED"
    | "DEAD_LETTER"
    | "CANCELLED"
    | "ARCHIVED";
  createdAtIso: string;
  updatedAtIso: string;
  fileName: string | null;
  downloadUrl: string | null;
  lastError: string | null;
};

export type ReportsActionResult = CatalogActionResult & {
  entityId?: string;
};

export type ReportPageResult<T> = {
  filters: Record<string, string | number>;
  pagination?: CatalogPagination;
  data: T;
};
