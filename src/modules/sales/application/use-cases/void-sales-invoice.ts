import { Prisma } from "@prisma/client";

import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { buildIdempotencyRequestHash } from "@/lib/idempotency/idempotency.service";
import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { reverseOperationalDocumentInTransaction } from "@/modules/accounting/application/use-cases/reverse-operational-document";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

type VoidSalesInvoiceInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  invoiceId: string;
  reason: string;
  idempotencyKey: string;
};

export async function voidSalesInvoice(input: VoidSalesInvoiceInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "sales_invoice.void",
    idempotencyKey: input.idempotencyKey,
    requestHash: buildIdempotencyRequestHash({
      invoiceId: input.invoiceId,
      reason: input.reason,
    }),
    resourceType: "SalesInvoice",
    resourceId: input.invoiceId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const invoice = await salesRepository.findInvoiceById(
            {
              organizationId: input.organizationId,
              invoiceId: input.invoiceId,
            },
            tx,
          );

          if (!invoice) {
            throw new NotFoundError("No encontramos la factura de venta.");
          }

          if (invoice.status !== "POSTED") {
            throw new DomainError("Solo puedes anular facturas ya publicadas.", "DOCUMENT_NOT_POSTED");
          }

          if (invoice.paymentAllocations.length > 0) {
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
            sourceType: "SALES_INVOICE",
            sourceId: invoice.id,
            reason: input.reason,
            sourceModule: "sales",
          });

          await salesRepository.markVoided(
            {
              invoiceId: invoice.id,
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
              entityType: "SalesInvoice",
              entityId: invoice.id,
              correlationId: input.correlationId,
              metadata: {
                reversalEntryId: reversalEntry?.id,
                reason: input.reason,
              },
            },
            tx,
          );

          return {
            invoiceId: invoice.id,
            reversalEntryId: reversalEntry?.id ?? null,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
