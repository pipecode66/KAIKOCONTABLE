import type { LedgerAccountFiltersInput } from "@/modules/accounting/dto/ledger-account.dto";
import { ledgerAccountRepository } from "@/modules/accounting/infrastructure/repositories/ledger-account.repository";
import { ledgerAccountFiltersSchema } from "@/modules/accounting/validators/ledger-account-filters.validator";

export async function listLedgerAccounts(input: {
  organizationId: string;
  filters?: LedgerAccountFiltersInput;
}) {
  const filters = ledgerAccountFiltersSchema.parse(input.filters ?? {});

  return ledgerAccountRepository.listCatalog({
    organizationId: input.organizationId,
    filters,
  });
}
