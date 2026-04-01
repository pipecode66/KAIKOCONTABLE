import type { VoucherFormDependenciesDto } from "@/modules/accounting/dto/accounting-core.dto";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";

export async function listVoucherFormDependencies(
  organizationId: string,
): Promise<VoucherFormDependenciesDto> {
  return accountingCoreRepository.listVoucherFormDependencies(organizationId);
}
