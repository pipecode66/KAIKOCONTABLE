import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type { PurchaseBillListItemDto } from "@/modules/purchases/dto/purchase-bill.dto";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";

type ListPurchaseBillsInput = {
  organizationId: string;
  filters: DocumentListFilters;
};

export async function listPurchaseBills(input: ListPurchaseBillsInput): Promise<{
  rows: PurchaseBillListItemDto[];
  totalItems: number;
}> {
  const { rows, totalItems } = await purchaseBillRepository.listBills(input);

  return {
    totalItems,
    rows: rows.map((row) => ({
      id: row.id,
      internalNumber: row.internalNumber,
      documentNumber: row.documentNumber,
      supplierName: row.supplier.name,
      issueDateIso: row.issueDate.toISOString(),
      dueDateIso: row.dueDate?.toISOString() ?? null,
      status: row.status,
      subtotal: row.subtotal.toString(),
      taxTotal: row.taxTotal.toString(),
      withholdingTotal: row.withholdingTotal.toString(),
      total: row.total.toString(),
      balanceDue: row.balanceDue.toString(),
      postedAtIso: row.postedAt?.toISOString() ?? null,
      voidReason: row.voidReason ?? null,
      version: row.version,
      journalEntryNumber: row.journalEntryNumber,
      lineCount: row._count.lines,
    })),
  };
}
