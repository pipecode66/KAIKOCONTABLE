import type { CatalogActionResult, CatalogSelectOption } from "@/modules/shared/dto/catalog-management.dto";

export type SalesInvoiceFormLineInput = {
  itemId?: string;
  accountId?: string;
  taxId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type SalesInvoiceFormInput = {
  id?: string;
  version?: number;
  customerId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  lines: SalesInvoiceFormLineInput[];
};

export type SalesActionResult = CatalogActionResult & {
  entityId?: string;
};

export type SalesInvoiceListItemDto = {
  id: string;
  internalNumber: string;
  documentNumber: string | null;
  customerName: string;
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

export type SalesInvoiceEditorDto = {
  id: string;
  customerId: string;
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

export type SalesInvoiceFormDependenciesDto = {
  customers: CatalogSelectOption[];
  items: Array<CatalogSelectOption & { defaultAccountId: string | null; defaultTaxId: string | null }>;
  accounts: CatalogSelectOption[];
  taxes: Array<CatalogSelectOption & { rate: string; isWithholding: boolean }>;
};
