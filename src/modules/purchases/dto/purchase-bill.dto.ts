import type { CatalogActionResult, CatalogSelectOption } from "@/modules/shared/dto/catalog-management.dto";

export type PurchaseBillFormLineInput = {
  itemId?: string;
  accountId?: string;
  taxId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type PurchaseBillFormInput = {
  id?: string;
  version?: number;
  supplierId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  lines: PurchaseBillFormLineInput[];
};

export type PurchaseBillActionResult = CatalogActionResult & {
  entityId?: string;
};

export type PurchaseBillListItemDto = {
  id: string;
  internalNumber: string;
  documentNumber: string | null;
  supplierName: string;
  issueDateIso: string;
  dueDateIso: string | null;
  status: "DRAFT" | "POSTED" | "VOIDED";
  subtotal: string;
  taxTotal: string;
  withholdingTotal: string;
  total: string;
  balanceDue: string;
  postedAtIso: string | null;
  voidReason: string | null;
  version: number;
  journalEntryNumber: string | null;
  lineCount: number;
};

export type PurchaseBillEditorDto = {
  id: string;
  supplierId: string;
  issueDateIso: string;
  dueDateIso: string | null;
  notes: string | null;
  version: number;
  lines: Array<{
    itemId: string | null;
    accountId: string | null;
    taxId: string | null;
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
};

export type PurchaseBillFormDependenciesDto = {
  suppliers: CatalogSelectOption[];
  items: Array<CatalogSelectOption & { defaultAccountId: string | null; defaultTaxId: string | null }>;
  accounts: CatalogSelectOption[];
  taxes: Array<CatalogSelectOption & { rate: string; isWithholding: boolean }>;
};
