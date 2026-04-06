import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { reverseOperationalDocumentInTransaction } from "@/modules/accounting/application/use-cases/reverse-operational-document";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type VoidPaymentInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  paymentId: string;
  reason: string;
  idempotencyKey: string;
};

export async function voidPayment(input: VoidPaymentInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "payment.void",
    idempotencyKey: input.idempotencyKey,
    requestHash: JSON.stringify({ paymentId: input.paymentId, reason: input.reason }),
    resourceType: "Payment",
    resourceId: input.paymentId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const payment = await treasuryOperationsRepository.findPaymentById(
            {
              organizationId: input.organizationId,
              paymentId: input.paymentId,
            },
            tx,
          );

          if (!payment) {
            throw new NotFoundError("No encontramos el pago solicitado.");
          }

          if (payment.status === "VOIDED") {
            return {
              paymentId: payment.id,
            };
          }

          if (payment.status !== "POSTED") {
            throw new DomainError("Solo puedes anular pagos ya publicados.", "DOCUMENT_NOT_POSTED");
          }

          await reverseOperationalDocumentInTransaction({
            tx,
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            correlationId: input.correlationId,
            sourceType: "PAYMENT",
            sourceId: payment.id,
            reason: input.reason,
            sourceModule: "treasury",
          });

          await treasuryOperationsRepository.markPaymentVoided(
            {
              paymentId: payment.id,
              voidedAt: new Date(),
              voidReason: input.reason,
            },
            tx,
          );

          for (const allocation of payment.allocations) {
            if (allocation.salesInvoiceId) {
              await salesRepository.applyAllocation(
                {
                  invoiceId: allocation.salesInvoiceId,
                  amount: allocation.amount,
                  increment: true,
                },
                tx,
              );
            }

            if (allocation.purchaseBillId) {
              await purchaseBillRepository.applyAllocation(
                {
                  billId: allocation.purchaseBillId,
                  amount: allocation.amount,
                  increment: true,
                },
                tx,
              );
            }

            if (allocation.expenseId) {
              await treasuryOperationsRepository.applyExpenseAllocation(
                {
                  expenseId: allocation.expenseId,
                  amount: allocation.amount,
                  increment: true,
                },
                tx,
              );
            }
          }

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "VOIDED",
              entityType: "Payment",
              entityId: payment.id,
              correlationId: input.correlationId,
              metadata: {
                reason: input.reason,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "treasury.payment.voided",
              aggregateType: "Payment",
              aggregateId: payment.id,
              correlationId: input.correlationId,
              dedupeKey: `treasury:payment:voided:${payment.id}`,
              payload: {
                paymentId: payment.id,
                reason: input.reason,
              },
            },
            tx,
          );

          return {
            paymentId: payment.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
