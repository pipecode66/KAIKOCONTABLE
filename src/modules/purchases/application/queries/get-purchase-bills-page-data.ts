import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import type {
  PurchaseBillEditorDto,
  PurchaseBillFormDependenciesDto,
  PurchaseBillListItemDto,
} from "@/modules/purchases/dto/purchase-bill.dto";
import { getPurchaseBillFormDependencies } from "@/modules/purchases/application/queries/get-purchase-bill-form-dependencies";
import { listPurchaseBills } from "@/modules/purchases/application/queries/list-purchase-bills";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";

type GetPurchaseBillsPageDataInput = {
  organizationId: string;
  filters: DocumentListFilters;
};

export async function getPurchaseBillsPageData(
  input: GetPurchaseBillsPageDataInput,
): Promise<{
  rows: PurchaseBillListItemDto[];
  totalItems: number;
  dependencies: PurchaseBillFormDependenciesDto;
  editors: Record<string, PurchaseBillEditorDto>;
}> {
  const [list, dependencies] = await Promise.all([
    listPurchaseBills(input),
    getPurchaseBillFormDependencies(input.organizationId),
  ]);

  const billDetails = await Promise.all(
    list.rows.map((row) =>
      purchaseBillRepository.findBillById({
        organizationId: input.organizationId,
        billId: row.id,
      }),
    ),
  );

  const editors = Object.fromEntries(
    billDetails
      .filter((bill): bill is NonNullable<typeof bill> => Boolean(bill))
      .map((bill) => [
        bill.id,
        {
          id: bill.id,
          supplierId: bill.supplierId,
          issueDateIso: bill.issueDate.toISOString(),
          dueDateIso: bill.dueDate?.toISOString() ?? null,
          notes: bill.notes ?? null,
          version: bill.version,
          lines: bill.lines.map((line) => ({
            itemId: line.itemId ?? null,
            accountId: line.accountId ?? null,
            taxId: line.taxId ?? null,
            description: line.description,
            quantity: line.quantity.toString(),
            unitPrice: line.unitPrice.toString(),
          })),
        } satisfies PurchaseBillEditorDto,
      ]),
  );

  return {
    rows: list.rows,
    totalItems: list.totalItems,
    dependencies,
    editors,
  };
}
