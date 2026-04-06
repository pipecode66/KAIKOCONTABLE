import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { reverseOperationalDocumentInTransaction } from "@/modules/accounting/application/use-cases/reverse-operational-document";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type VoidTransferInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  transferId: string;
  reason: string;
  idempotencyKey: string;
};

export async function voidTransfer(input: VoidTransferInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "transfer.void",
    idempotencyKey: input.idempotencyKey,
    requestHash: JSON.stringify({ transferId: input.transferId, reason: input.reason }),
    resourceType: "Transfer",
    resourceId: input.transferId,
    handler: async () =>
      prisma.$transaction(
        async (tx) => {
          const transfer = await treasuryOperationsRepository.findTransferById(
            {
              organizationId: input.organizationId,
              transferId: input.transferId,
            },
            tx,
          );

          if (!transfer) {
            throw new NotFoundError("No encontramos el traslado solicitado.");
          }

          if (transfer.status === "VOIDED") {
            return {
              transferId: transfer.id,
            };
          }

          if (transfer.status !== "POSTED") {
            throw new DomainError("Solo puedes anular traslados ya publicados.", "DOCUMENT_NOT_POSTED");
          }

          await reverseOperationalDocumentInTransaction({
            tx,
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            correlationId: input.correlationId,
            sourceType: "TRANSFER",
            sourceId: transfer.id,
            reason: input.reason,
            sourceModule: "treasury",
          });

          await treasuryOperationsRepository.markTransferVoided(
            {
              transferId: transfer.id,
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
              entityType: "Transfer",
              entityId: transfer.id,
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
              eventType: "treasury.transfer.voided",
              aggregateType: "Transfer",
              aggregateId: transfer.id,
              correlationId: input.correlationId,
              dedupeKey: `treasury:transfer:voided:${transfer.id}`,
              payload: {
                transferId: transfer.id,
                reason: input.reason,
              },
            },
            tx,
          );

          return {
            transferId: transfer.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
