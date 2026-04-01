import { Prisma } from "@prisma/client";

import {
  buildIdempotencyRequestHash,
  executeIdempotent,
} from "@/lib/idempotency/idempotency.service";
import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { reverseOperationalDocumentInTransaction } from "@/modules/accounting/application/use-cases/reverse-operational-document";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";

type VoidPurchaseBillInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  billId: string;
  reason: string;
  idempotencyKey: string;
};

export async function voidPurchaseBill(input: VoidPurchaseBillInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "purchase_bill.void",
    idempotencyKey: input.idempotencyKey,
    requestHash: buildIdempotencyRequestHash({
      billId: input.billId,
      reason: input.reason,
    }),
    resourceType: "PurchaseBill",
    resourceId: input.billId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const bill = await purchaseBillRepository.findBillById(
            {
              organizationId: input.organizationId,
              billId: input.billId,
            },
            tx,
          );

          if (!bill) {
            throw new NotFoundError("No encontramos la factura de compra.");
          }

          if (bill.status !== "POSTED") {
            throw new DomainError("Solo puedes anular facturas ya publicadas.", "DOCUMENT_NOT_POSTED");
          }

          if (bill.paymentAllocations.length > 0) {
            throw new DomainError(
              "No puedes anular una factura con pagos aplicados.",
              "DOCUMENT_HAS_ALLOCATIONS",
            );
          }

          const { reversalEntry } = await reverseOperationalDocumentInTransaction({
            tx,
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            correlationId: input.correlationId,
            sourceType: "PURCHASE_BILL",
            sourceId: bill.id,
            reason: input.reason,
            sourceModule: "purchases",
          });

          await purchaseBillRepository.markVoided(
            {
              billId: bill.id,
              voidedAt: new Date(),
              voidReason: input.reason,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "VOIDED",
              entityType: "PurchaseBill",
              entityId: bill.id,
              correlationId: input.correlationId,
              metadata: {
                reversalEntryId: reversalEntry?.id,
                reason: input.reason,
              },
            },
            tx,
          );

          return {
            billId: bill.id,
            reversalEntryId: reversalEntry?.id ?? null,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
