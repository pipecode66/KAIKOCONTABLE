import type { CatalogActionResult, CatalogSelectOption } from "@/modules/shared/dto/catalog-management.dto";

export type PaymentAllocationFormInput = {
  documentType: "SALES_INVOICE" | "PURCHASE_BILL" | "EXPENSE";
  documentId: string;
  amount: string;
};

export type PaymentFormInput = {
  id?: string;
  version?: number;
  thirdPartyId?: string;
  methodId: string;
  bankAccountId?: string;
  cashAccountId?: string;
  direction: "RECEIVED" | "SENT";
  paymentDate: string;
  amount: string;
  reference?: string;
  notes?: string;
  allocations: PaymentAllocationFormInput[];
};

export type TransferFormInput = {
  id?: string;
  version?: number;
  sourceBankAccountId?: string;
  sourceCashAccountId?: string;
  destinationBankAccountId?: string;
  destinationCashAccountId?: string;
  transferDate: string;
  amount: string;
  reference?: string;
  notes?: string;
};

export type TreasuryActionResult = CatalogActionResult & {
  entityId?: string;
};

export type PaymentListItemDto = {
  id: string;
  reference: string | null;
  direction: "RECEIVED" | "SENT";
  paymentDateIso: string;
  status: "DRAFT" | "POSTED" | "VOIDED";
  amount: string;
  notes: string | null;
  partyName: string | null;
  methodName: string;
  treasuryAccountName: string;
  treasuryAccountType: "BANK" | "CASH";
  journalEntryNumber: string | null;
  allocationCount: number;
  version: number;
  voidReason: string | null;
};

export type PaymentEditorDto = {
  id: string;
  version: number;
  thirdPartyId: string | null;
  methodId: string;
  bankAccountId: string | null;
  cashAccountId: string | null;
  direction: "RECEIVED" | "SENT";
  paymentDateIso: string;
  amount: string;
  reference: string | null;
  notes: string | null;
  allocations: PaymentAllocationFormInput[];
};

export type PaymentFormDependenciesDto = {
  thirdParties: CatalogSelectOption[];
  methods: CatalogSelectOption[];
  bankAccounts: CatalogSelectOption[];
  cashAccounts: CatalogSelectOption[];
  openDocuments: Array<{
    value: string;
    label: string;
    documentType: "SALES_INVOICE" | "PURCHASE_BILL" | "EXPENSE";
    thirdPartyId: string | null;
    balanceDue: string;
  }>;
};

export type TransferListItemDto = {
  id: string;
  reference: string | null;
  transferDateIso: string;
  status: "DRAFT" | "POSTED" | "VOIDED";
  amount: string;
  notes: string | null;
  sourceLabel: string;
  destinationLabel: string;
  journalEntryNumber: string | null;
  version: number;
  voidReason: string | null;
};

export type TransferEditorDto = {
  id: string;
  version: number;
  sourceBankAccountId: string | null;
  sourceCashAccountId: string | null;
  destinationBankAccountId: string | null;
  destinationCashAccountId: string | null;
  transferDateIso: string;
  amount: string;
  reference: string | null;
  notes: string | null;
};

export type TransferFormDependenciesDto = {
  bankAccounts: CatalogSelectOption[];
  cashAccounts: CatalogSelectOption[];
};

export type StatementImportListItemDto = {
  id: string;
  fileName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  bankAccountName: string;
  rowsCount: number;
  importedAtIso: string | null;
  createdAtIso: string;
  sampleLines: Array<{
    id: string;
    transactionDateIso: string;
    description: string;
    amount: string;
    balance: string | null;
  }>;
};

export type StatementImportDependenciesDto = {
  bankAccounts: CatalogSelectOption[];
};

export type ReconciliationSuggestionDto = {
  bankStatementLineId: string;
  transactionDateIso: string;
  description: string;
  reference: string | null;
  amount: string;
  matchedDocumentType: "PAYMENT" | "TRANSFER";
  matchedDocumentId: string;
  matchedDocumentLabel: string;
  matchedAmount: string;
  confidence: "high" | "medium";
  notes: string | null;
};

export type ReconciliationListItemDto = {
  id: string;
  bankAccountName: string;
  periodStartIso: string;
  periodEndIso: string;
  statementBalance: string;
  bookBalance: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  notes: string | null;
  lineCount: number;
  suggestions: ReconciliationSuggestionDto[];
};

export type ReconciliationCreateInput = {
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  notes?: string;
};

export type ReconciliationCompleteInput = {
  reconciliationId: string;
  selections: Array<{
    bankStatementLineId: string;
    matchedDocumentType: "PAYMENT" | "TRANSFER";
    matchedDocumentId: string;
    matchedAmount: string;
    notes?: string;
  }>;
};

export type TreasuryOverviewDto = {
  organizationSlug: string;
  organizationName: string;
  metrics: {
    availableBanks: string;
    availableCash: string;
    pendingImports: number;
    openReconciliations: number;
  };
  bankBalances: Array<{
    id: string;
    code: string;
    name: string;
    balance: string;
  }>;
  cashBalances: Array<{
    id: string;
    code: string;
    name: string;
    balance: string;
  }>;
  recentPayments: PaymentListItemDto[];
  recentTransfers: TransferListItemDto[];
  recentImports: StatementImportListItemDto[];
  recentReconciliations: ReconciliationListItemDto[];
};

export type TreasuryBalanceSnapshotDto = {
  bankBalances: Array<{
    id: string;
    code: string;
    name: string;
    balance: string;
  }>;
  cashBalances: Array<{
    id: string;
    code: string;
    name: string;
    balance: string;
  }>;
};
