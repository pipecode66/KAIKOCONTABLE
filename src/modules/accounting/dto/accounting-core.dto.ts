import type {
  AccountingPeriodStatus,
  DocumentStatus,
  JournalEntryType,
  JournalSourceType,
  VoucherType,
} from "@prisma/client";

export type AccountingPeriodListItemDto = {
  id: string;
  fiscalYear: number;
  periodNumber: number;
  periodStartIso: string;
  periodEndIso: string;
  status: AccountingPeriodStatus;
  journalEntriesCount: number;
  vouchersCount: number;
  closedAtIso: string | null;
  closedByName: string | null;
  lockedAtIso: string | null;
  lockedByName: string | null;
  reopenedAtIso: string | null;
  reopenedByName: string | null;
};

export type ManualVoucherLineInput = {
  id?: string;
  ledgerAccountId: string;
  thirdPartyId?: string;
  costCenterId?: string;
  description?: string;
  debit: string;
  credit: string;
};

export type ManualVoucherFormInput = {
  id?: string;
  version?: number;
  voucherType: VoucherType;
  entryDate: string;
  description: string;
  lines: ManualVoucherLineInput[];
};

export type ManualVoucherListItemDto = {
  id: string;
  voucherNumber: string | null;
  voucherType: VoucherType;
  description: string;
  entryDateIso: string;
  status: DocumentStatus;
  debitTotal: string;
  creditTotal: string;
  postedAtIso: string | null;
  voidedAtIso: string | null;
  voidReason: string | null;
  version: number;
  periodLabel: string;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  lines: Array<{
    id: string;
    ledgerAccountCode: string;
    ledgerAccountName: string;
    description: string | null;
    debit: string;
    credit: string;
  }>;
};

export type JournalEntryListItemDto = {
  id: string;
  entryNumber: string;
  entryDateIso: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string;
  entryType: JournalEntryType;
  totalDebit: string;
  totalCredit: string;
  postedAtIso: string | null;
  reversalOfId: string | null;
  reversalReason: string | null;
  reversedByIds: string[];
  voucherId: string | null;
  voucherNumber: string | null;
  lines: Array<{
    id: string;
    ledgerAccountCode: string;
    ledgerAccountName: string;
    description: string | null;
    debit: string;
    credit: string;
  }>;
};

export type AccountingCoreOverviewDto = {
  organizationSlug: string;
  organizationName: string;
  canManageAccounting: boolean;
  canPostManualVoucher: boolean;
  canManagePeriods: boolean;
  metrics: {
    openPeriods: number;
    draftVouchers: number;
    postedVouchers: number;
    postedEntries: number;
  };
  recentPeriods: AccountingPeriodListItemDto[];
  recentVouchers: ManualVoucherListItemDto[];
  recentEntries: JournalEntryListItemDto[];
};

export type VoucherFormDependenciesDto = {
  accounts: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  thirdParties: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  costCenters: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  openPeriods: Array<{
    id: string;
    label: string;
  }>;
};

export type AccountingActionResult = {
  success: boolean;
  message: string;
  entityId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const voucherTypeOptions: Array<{ value: VoucherType; label: string }> = [
  { value: "MANUAL_ADJUSTMENT", label: "Ajuste manual" },
  { value: "OPENING_BALANCE", label: "Saldo inicial" },
  { value: "PERIOD_CLOSING", label: "Cierre de periodo" },
];
