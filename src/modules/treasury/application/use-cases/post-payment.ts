import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildPaymentPostingLines } from "@/modules/accounting/domain/services/operational-posting.service";
import { summarizePosting } from "@/modules/accounting/domain/services/posting-engine.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";

type PostPaymentInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  paymentId: string;
  idempotencyKey: string;
  requestHash: string;
};

export async function postPayment(input: PostPaymentInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "payment.post",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
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

          if (payment.status !== "DRAFT") {
            throw new DomainError("Solo puedes postear pagos en borrador.", "DOCUMENT_NOT_DRAFT");
          }

          if (!payment.allocations.length) {
            throw new DomainError("El pago debe tener al menos una aplicacion antes de publicarse.", "EMPTY_PAYMENT_ALLOCATIONS");
          }

          const period = await accountingCoreRepository.resolvePeriodByDate(
            {
              organizationId: input.organizationId,
              date: payment.paymentDate,
            },
            tx,
          );

          if (!period) {
            throw new DomainError("No existe un periodo abierto para la fecha del pago.", "MISSING_PERIOD");
          }

          assertPeriodIsOpen(period);

          const existingEntry = await accountingCoreRepository.findJournalEntryBySource(
            {
              organizationId: input.organizationId,
              sourceType: "PAYMENT",
              sourceId: payment.id,
            },
            tx,
          );

          if (existingEntry) {
            return {
              paymentId: payment.id,
              reference: payment.reference,
              journalEntryId: existingEntry.id,
              journalEntryNumber: existingEntry.entryNumber,
            };
          }

          const paymentNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "payment",
              fiscalYear: getFiscalYearForDate(payment.paymentDate),
            },
            tx,
          );

          const entryNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "journal_entry",
              fiscalYear: getFiscalYearForDate(payment.paymentDate),
            },
            tx,
          );

          const postingAccounts = await accountingCoreRepository.resolveOperationalPostingAccounts(
            input.organizationId,
            tx,
          );

          const postingLines = buildPaymentPostingLines({
            accounts: postingAccounts,
            thirdPartyId: payment.thirdPartyId,
            description: payment.reference ?? paymentNumber,
            direction: payment.direction,
            amount: payment.amount,
            toBank: Boolean(payment.bankAccountId),
          });

          const totals = summarizePosting(postingLines);
          const postedAt = new Date();
          const officialReference =
            payment.reference && !payment.reference.startsWith("PM-DRAFT-")
              ? `${paymentNumber} · ${payment.reference}`
              : paymentNumber;

          const journalEntry = await accountingCoreRepository.createJournalEntry(
            {
              organizationId: input.organizationId,
              accountingPeriodId: period.id,
              currencyId: payment.currencyId,
              entryNumber,
              entryDate: payment.paymentDate,
              sourceType: "PAYMENT",
              sourceId: payment.id,
              entryType: "SYSTEM",
              description: `Pago ${officialReference}`,
              totalDebit: new Prisma.Decimal(totals.totalDebit.toString()),
              totalCredit: new Prisma.Decimal(totals.totalCredit.toString()),
              postedAt,
              lines: postingLines.map((line) => ({
                ledgerAccountId: line.ledgerAccountId,
                thirdPartyId: line.thirdPartyId ?? null,
                costCenterId: line.costCenterId ?? null,
                description: line.description ?? null,
                debit: new Prisma.Decimal(line.debit.toString()),
                credit: new Prisma.Decimal(line.credit.toString()),
              })),
            },
            tx,
          );

          await treasuryOperationsRepository.markPaymentPosted(
            {
              paymentId: payment.id,
              reference: officialReference,
              postedAt,
            },
            tx,
          );

          for (const allocation of payment.allocations) {
            if (allocation.salesInvoiceId) {
              await salesRepository.applyAllocation(
                {
                  invoiceId: allocation.salesInvoiceId,
                  amount: allocation.amount,
                },
                tx,
              );
            }

            if (allocation.purchaseBillId) {
              await purchaseBillRepository.applyAllocation(
                {
                  billId: allocation.purchaseBillId,
                  amount: allocation.amount,
                },
                tx,
              );
            }

            if (allocation.expenseId) {
              await treasuryOperationsRepository.applyExpenseAllocation(
                {
                  expenseId: allocation.expenseId,
                  amount: allocation.amount,
                },
                tx,
              );
            }
          }

          await accountingCoreRepository.createDocumentLink(
            {
              organizationId: input.organizationId,
              sourceModule: "treasury",
              sourceType: "PAYMENT",
              sourceId: payment.id,
              journalEntryId: journalEntry.id,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "Payment",
              entityId: payment.id,
              correlationId: input.correlationId,
              afterState: {
                reference: officialReference,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "treasury.payment.posted",
              aggregateType: "Payment",
              aggregateId: payment.id,
              correlationId: input.correlationId,
              dedupeKey: `treasury:payment:posted:${payment.id}`,
              payload: {
                paymentId: payment.id,
                reference: officialReference,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          return {
            paymentId: payment.id,
            reference: officialReference,
            journalEntryId: journalEntry.id,
            journalEntryNumber: journalEntry.entryNumber,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      ),
  });
}
