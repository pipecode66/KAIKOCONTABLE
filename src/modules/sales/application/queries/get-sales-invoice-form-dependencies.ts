import type { SalesInvoiceFormDependenciesDto } from "@/modules/sales/dto/sales.dto";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

export async function getSalesInvoiceFormDependencies(
  organizationId: string,
): Promise<SalesInvoiceFormDependenciesDto> {
  const dependencies = await salesRepository.listFormDependencies(organizationId);

  return {
    customers: dependencies.customers.map((customer) => ({
      value: customer.id,
      label: `${customer.code} - ${customer.name}`,
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
