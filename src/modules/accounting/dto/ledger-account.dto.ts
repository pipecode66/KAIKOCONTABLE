export const LEDGER_ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
  "COST_OF_SALES",
  "MEMORANDUM",
] as const;

export const NORMAL_BALANCES = ["DEBIT", "CREDIT"] as const;

export const LEDGER_ACCOUNT_FILTER_STATUSES = ["ACTIVE", "ARCHIVED", "ALL"] as const;

export type LedgerAccountTypeValue = (typeof LEDGER_ACCOUNT_TYPES)[number];
export type NormalBalanceValue = (typeof NORMAL_BALANCES)[number];
export type LedgerAccountFilterStatus = (typeof LEDGER_ACCOUNT_FILTER_STATUSES)[number];

export const ledgerAccountTypeOptions: Array<{
  value: LedgerAccountTypeValue;
  label: string;
}> = [
  { value: "ASSET", label: "Activo" },
  { value: "LIABILITY", label: "Pasivo" },
  { value: "EQUITY", label: "Patrimonio" },
  { value: "REVENUE", label: "Ingreso" },
  { value: "EXPENSE", label: "Gasto" },
  { value: "COST_OF_SALES", label: "Costo de venta" },
  { value: "MEMORANDUM", label: "Memorando" },
];

export const normalBalanceOptions: Array<{
  value: NormalBalanceValue;
  label: string;
}> = [
  { value: "DEBIT", label: "Debito" },
  { value: "CREDIT", label: "Credito" },
];

export const ledgerAccountStatusOptions: Array<{
  value: LedgerAccountFilterStatus;
  label: string;
}> = [
  { value: "ACTIVE", label: "Activas" },
  { value: "ARCHIVED", label: "Archivadas" },
  { value: "ALL", label: "Todas" },
];

export type LedgerAccountFiltersInput = {
  q?: string;
  type?: LedgerAccountTypeValue | "ALL";
  status?: LedgerAccountFilterStatus;
};

export type ResolvedLedgerAccountFilters = {
  q?: string;
  type: LedgerAccountTypeValue | "ALL";
  status: LedgerAccountFilterStatus;
};

export type LedgerAccountFormInput = {
  id?: string;
  code: string;
  name: string;
  description?: string;
  type: LedgerAccountTypeValue;
  normalBalance: NormalBalanceValue;
  parentId?: string;
  isPosting: boolean;
  allowManualEntries: boolean;
};

export type LedgerAccountParentOptionDto = {
  id: string;
  code: string;
  name: string;
  type: LedgerAccountTypeValue;
};

export type LedgerAccountListItemDto = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: LedgerAccountTypeValue;
  normalBalance: NormalBalanceValue;
  parentId?: string | null;
  parentCode?: string | null;
  parentName?: string | null;
  isPosting: boolean;
  allowManualEntries: boolean;
  hasChildren: boolean;
  status: "ACTIVE" | "ARCHIVED";
  updatedAt: string;
};

export type LedgerAccountSummaryDto = {
  totalActive: number;
  totalArchived: number;
  totalPosting: number;
  totalManual: number;
};

export type LedgerAccountCatalogDto = {
  filters: ResolvedLedgerAccountFilters;
  rows: LedgerAccountListItemDto[];
  summary: LedgerAccountSummaryDto;
};

export type LedgerAccountActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof LedgerAccountFormInput, string[]>>;
  accountId?: string;
};
