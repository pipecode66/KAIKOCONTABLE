import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type {
  SalesInvoiceEditorDto,
  SalesInvoiceFormDependenciesDto,
  SalesInvoiceListItemDto,
} from "@/modules/sales/dto/sales.dto";
import { getSalesInvoiceFormDependencies } from "@/modules/sales/application/queries/get-sales-invoice-form-dependencies";
import { listSalesInvoices } from "@/modules/sales/application/queries/list-sales-invoices";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

type GetSalesInvoicesPageDataInput = {
  organizationId: string;
  filters: DocumentListFilters;
};

export async function getSalesInvoicesPageData(
  input: GetSalesInvoicesPageDataInput,
): Promise<{
  rows: SalesInvoiceListItemDto[];
  totalItems: number;
  dependencies: SalesInvoiceFormDependenciesDto;
  editors: Record<string, SalesInvoiceEditorDto>;
}> {
  const [list, dependencies] = await Promise.all([
    listSalesInvoices(input),
    getSalesInvoiceFormDependencies(input.organizationId),
  ]);

  const invoiceDetails = await Promise.all(
    list.rows.map((row) =>
      salesRepository.findInvoiceById({
        organizationId: input.organizationId,
        invoiceId: row.id,
      }),
    ),
  );

  const editors = Object.fromEntries(
    invoiceDetails
      .filter((invoice): invoice is NonNullable<typeof invoice> => Boolean(invoice))
      .map((invoice) => [
        invoice.id,
        {
          id: invoice.id,
          customerId: invoice.customerId,
          issueDateIso: invoice.issueDate.toISOString(),
          dueDateIso: invoice.dueDate?.toISOString() ?? null,
          notes: invoice.notes ?? null,
          version: invoice.version,
          lines: invoice.lines.map((line) => ({
            itemId: line.itemId ?? null,
            accountId: line.accountId ?? null,
            taxId: line.taxId ?? null,
            description: line.description,
            quantity: line.quantity.toString(),
            unitPrice: line.unitPrice.toString(),
          })),
        } satisfies SalesInvoiceEditorDto,
      ]),
  );

  return {
    rows: list.rows,
    totalItems: list.totalItems,
    dependencies,
    editors,
  };
}
