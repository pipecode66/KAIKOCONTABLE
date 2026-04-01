import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type { SalesInvoiceListItemDto } from "@/modules/sales/dto/sales.dto";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

type ListSalesInvoicesInput = {
  organizationId: string;
  filters: DocumentListFilters;
};

export async function listSalesInvoices(input: ListSalesInvoicesInput): Promise<{
  rows: SalesInvoiceListItemDto[];
  totalItems: number;
}> {
  const { rows, totalItems } = await salesRepository.listInvoices(input);

  return {
    totalItems,
    rows: rows.map((row) => ({
      id: row.id,
      internalNumber: row.internalNumber,
      documentNumber: row.documentNumber,
      customerName: row.customer.name,
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
