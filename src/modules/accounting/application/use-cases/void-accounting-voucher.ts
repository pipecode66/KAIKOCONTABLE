import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { reverseJournalEntry } from "@/modules/accounting/application/use-cases/reverse-journal-entry";
import { DomainError, NotFoundError } from "@/lib/errors";

type VoidAccountingVoucherInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  voucherId: string;
  reason: string;
  idempotencyKey: string;
};

export async function voidAccountingVoucher(input: VoidAccountingVoucherInput) {
  const voucher = await accountingCoreRepository.findVoucherById({
    organizationId: input.organizationId,
    voucherId: input.voucherId,
  });

  if (!voucher) {
    throw new NotFoundError("No encontramos el voucher solicitado.");
  }

  if (voucher.status === "VOIDED") {
    return {
      voucherId: voucher.id,
      status: voucher.status,
    };
  }

  if (voucher.status !== "POSTED") {
    throw new DomainError("Solo los vouchers publicados se anulan mediante reversion.", "VOUCHER_NOT_POSTED");
  }

  const linkedJournalEntry = voucher.documentLinks.find((link) => link.journalEntryId)?.journalEntry;

  if (!linkedJournalEntry) {
    throw new DomainError("El voucher no tiene asiento publicado vinculado.", "MISSING_LINKED_ENTRY");
  }

  return reverseJournalEntry({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    correlationId: input.correlationId,
    journalEntryId: linkedJournalEntry.id,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
    requestHash: buildIdempotencyRequestHash({
      voucherId: voucher.id,
      journalEntryId: linkedJournalEntry.id,
      reason: input.reason,
    }),
    voidVoucherId: voucher.id,
  });
}
