import { ledgerAccountRepository } from "@/modules/accounting/infrastructure/repositories/ledger-account.repository";

export async function listLedgerAccountParentOptions(input: {
  organizationId: string;
  excludeId?: string;
}) {
  return ledgerAccountRepository.listParentOptions(input);
}
