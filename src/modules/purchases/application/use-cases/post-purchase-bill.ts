import { Prisma } from "@prisma/client";

import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildPurchaseBillPostingLines } from "@/modules/accounting/domain/services/operational-posting.service";
import { summarizePosting } from "@/modules/accounting/domain/services/posting-engine.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { purchaseBillRepository } from "@/modules/purchases/infrastructure/repositories/purchase-bill.repository";

type PostPurchaseBillInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  billId: string;
  idempotencyKey: string;
  requestHash: string;
};

export async function postPurchaseBill(input: PostPurchaseBillInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "purchase_bill.post",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
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
            throw new NotFoundError("No encontramos la factura de compra solicitada.");
          }

          if (bill.status !== "DRAFT") {
            throw new DomainError("Solo puedes postear facturas en borrador.", "DOCUMENT_NOT_DRAFT");
          }

          if (!bill.lines.length) {
            throw new DomainError("La factura no tiene lineas para publicar.", "EMPTY_DOCUMENT_LINES");
          }

          const period = await accountingCoreRepository.resolvePeriodByDate(
            {
              organizationId: input.organizationId,
              date: bill.issueDate,
            },
            tx,
          );

          if (!period) {
            throw new DomainError("No existe un periodo abierto para la fecha de la factura.", "MISSING_PERIOD");
          }

          assertPeriodIsOpen(period);

          const existingEntry = await accountingCoreRepository.findJournalEntryBySource(
            {
              organizationId: input.organizationId,
              sourceType: "PURCHASE_BILL",
              sourceId: bill.id,
            },
            tx,
          );

          if (existingEntry) {
            return {
              billId: bill.id,
              documentNumber: bill.documentNumber,
              journalEntryId: existingEntry.id,
              journalEntryNumber: existingEntry.entryNumber,
            };
          }

          const postingAccounts = await accountingCoreRepository.resolveOperationalPostingAccounts(
            input.organizationId,
            tx,
          );

          const documentNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "purchase_bill",
              fiscalYear: getFiscalYearForDate(bill.issueDate),
            },
            tx,
          );

          const entryNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "journal_entry",
              fiscalYear: getFiscalYearForDate(bill.issueDate),
            },
            tx,
          );

          const postingLines = buildPurchaseBillPostingLines({
            accounts: postingAccounts,
            thirdPartyId: bill.supplierId,
            description: bill.documentNumber ?? bill.internalNumber,
            total: bill.total,
            taxTotal: bill.taxTotal,
            withholdingTotal: bill.withholdingTotal,
            lines: bill.lines.map((line) => ({
              ledgerAccountId: line.accountId!,
              description: line.description,
              lineSubtotal: line.lineSubtotal,
              taxAmount: line.taxAmount,
              isWithholding: Boolean(line.tax?.isWithholding),
            })),
          });

          const totals = summarizePosting(postingLines);
          const postedAt = new Date();

          const journalEntry = await accountingCoreRepository.createJournalEntry(
            {
              organizationId: input.organizationId,
              accountingPeriodId: period.id,
              currencyId: bill.currencyId,
              entryNumber,
              entryDate: bill.issueDate,
              sourceType: "PURCHASE_BILL",
              sourceId: bill.id,
              entryType: "SYSTEM",
              description: `Factura de compra ${documentNumber}`,
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

          await purchaseBillRepository.markPosted(
            {
              billId: bill.id,
              documentNumber,
              postedAt,
            },
            tx,
          );

          await accountingCoreRepository.createDocumentLink(
            {
              organizationId: input.organizationId,
              sourceModule: "purchases",
              sourceType: "PURCHASE_BILL",
              sourceId: bill.id,
              journalEntryId: journalEntry.id,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "PurchaseBill",
              entityId: bill.id,
              correlationId: input.correlationId,
              afterState: {
                documentNumber,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          await addOutboxMessage(
            {
              organizationId: input.organizationId,
              eventType: "purchases.bill.posted",
              aggregateType: "PurchaseBill",
              aggregateId: bill.id,
              correlationId: input.correlationId,
              dedupeKey: `purchases:bill:posted:${bill.id}`,
              payload: {
                billId: bill.id,
                documentNumber,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          return {
            billId: bill.id,
            documentNumber,
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
