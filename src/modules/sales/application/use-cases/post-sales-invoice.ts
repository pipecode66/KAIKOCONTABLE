import { Prisma } from "@prisma/client";

import { executeIdempotent } from "@/lib/idempotency/idempotency.service";
import { addOutboxMessage } from "@/lib/outbox/outbox.service";
import { DomainError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { buildSalesInvoicePostingLines } from "@/modules/accounting/domain/services/operational-posting.service";
import { summarizePosting } from "@/modules/accounting/domain/services/posting-engine.service";
import { getFiscalYearForDate } from "@/modules/accounting/domain/services/sequence.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

type PostSalesInvoiceInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  invoiceId: string;
  idempotencyKey: string;
  requestHash: string;
};

export async function postSalesInvoice(input: PostSalesInvoiceInput) {
  return executeIdempotent({
    organizationId: input.organizationId,
    action: "sales_invoice.post",
    idempotencyKey: input.idempotencyKey,
    requestHash: input.requestHash,
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
            throw new NotFoundError("No encontramos la factura de venta solicitada.");
          }

          if (invoice.status !== "DRAFT") {
            throw new DomainError("Solo puedes postear facturas en borrador.", "DOCUMENT_NOT_DRAFT");
          }

          if (!invoice.lines.length) {
            throw new DomainError("La factura no tiene lineas para publicar.", "EMPTY_DOCUMENT_LINES");
          }

          const period = await accountingCoreRepository.resolvePeriodByDate(
            {
              organizationId: input.organizationId,
              date: invoice.issueDate,
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
              sourceType: "SALES_INVOICE",
              sourceId: invoice.id,
            },
            tx,
          );

          if (existingEntry) {
            return {
              invoiceId: invoice.id,
              documentNumber: invoice.documentNumber,
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
              documentType: "sales_invoice",
              fiscalYear: getFiscalYearForDate(invoice.issueDate),
            },
            tx,
          );

          const entryNumber = await accountingCoreRepository.reserveSequenceNumber(
            {
              organizationId: input.organizationId,
              documentType: "journal_entry",
              fiscalYear: getFiscalYearForDate(invoice.issueDate),
            },
            tx,
          );

          const postingLines = buildSalesInvoicePostingLines({
            accounts: postingAccounts,
            thirdPartyId: invoice.customerId,
            description: invoice.documentNumber ?? invoice.internalNumber,
            total: invoice.total,
            withholdingTotal: invoice.withholdingTotal,
            taxTotal: invoice.taxTotal,
            lines: invoice.lines.map((line) => ({
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
              currencyId: invoice.currencyId,
              entryNumber,
              entryDate: invoice.issueDate,
              sourceType: "SALES_INVOICE",
              sourceId: invoice.id,
              entryType: "SYSTEM",
              description: `Factura de venta ${documentNumber}`,
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

          await salesRepository.markPosted(
            {
              invoiceId: invoice.id,
              documentNumber,
              postedAt,
            },
            tx,
          );

          await accountingCoreRepository.createDocumentLink(
            {
              organizationId: input.organizationId,
              sourceModule: "sales",
              sourceType: "SALES_INVOICE",
              sourceId: invoice.id,
              journalEntryId: journalEntry.id,
            },
            tx,
          );

          await writeAuditLog(
            {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "POSTED",
              entityType: "SalesInvoice",
              entityId: invoice.id,
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
              eventType: "sales.invoice.posted",
              aggregateType: "SalesInvoice",
              aggregateId: invoice.id,
              correlationId: input.correlationId,
              dedupeKey: `sales:invoice:posted:${invoice.id}`,
              payload: {
                invoiceId: invoice.id,
                documentNumber,
                journalEntryId: journalEntry.id,
                journalEntryNumber: journalEntry.entryNumber,
              },
            },
            tx,
          );

          return {
            invoiceId: invoice.id,
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
