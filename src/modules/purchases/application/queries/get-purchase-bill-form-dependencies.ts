import type { PurchaseBillFormDependenciesDto } from "@/modules/purchases/dto/purchase-bill.dto";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";

export async function getPurchaseBillFormDependencies(
  organizationId: string,
): Promise<PurchaseBillFormDependenciesDto> {
  const dependencies = await purchaseBillRepository.listFormDependencies(organizationId);

  return {
    suppliers: dependencies.suppliers.map((supplier) => ({
      value: supplier.id,
      label: `${supplier.code} - ${supplier.name}`,
    })),
    items: dependencies.items.map((item) => ({
      value: item.id,
      label: `${item.code} - ${item.name}`,
      defaultAccountId: item.defaultLedgerAccountId,
      defaultTaxId: item.defaultTaxId,
    })),
    accounts: dependencies.accounts.map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
    })),
    taxes: dependencies.taxes.map((tax) => ({
      value: tax.id,
      label: `${tax.code} - ${tax.name}`,
      rate: tax.rate.toString(),
      isWithholding: tax.isWithholding,
    })),
  };
}
