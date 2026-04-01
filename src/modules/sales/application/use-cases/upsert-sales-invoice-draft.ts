import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney } from "@/lib/money/money.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { computeOperationalDocumentTotals } from "@/modules/accounting/domain/services/operational-document-totals.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import type { SalesInvoiceFormInput } from "@/modules/sales/dto/sales.dto";
import { salesRepository } from "@/modules/sales/infrastructure/repositories/sales.repository";

type UpsertSalesInvoiceDraftInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: SalesInvoiceFormInput;
};

function sanitizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function upsertSalesInvoiceDraft(input: UpsertSalesInvoiceDraftInput) {
  return prisma.$transaction(async (tx) => {
    const organization = await accountingCoreRepository.getOrganizationContext(input.organizationId);
    const customer = await salesRepository.findCustomerById(input.organizationId, input.data.customerId, tx);

    if (!customer) {
      throw new NotFoundError("No encontramos el cliente seleccionado.");
    }

    const itemIds = input.data.lines.map((line) => line.itemId).filter(Boolean) as string[];
    const explicitAccountIds = input.data.lines
      .map((line) => line.accountId)
      .filter(Boolean) as string[];
    const taxIds = input.data.lines.map((line) => line.taxId).filter(Boolean) as string[];

    const items = await salesRepository.findItemsByIds(input.organizationId, itemIds, tx);
    const itemDefaultAccountIds = items
      .map((item) => item.defaultLedgerAccountId)
      .filter(Boolean) as string[];

    const [accounts, taxes] = await Promise.all([
      salesRepository.findAccountsByIds(
        input.organizationId,
        [...new Set([...explicitAccountIds, ...itemDefaultAccountIds])],
        tx,
      ),
      salesRepository.findTaxesByIds(input.organizationId, taxIds, tx),
    ]);

    const itemsById = new Map(items.map((item) => [item.id, item]));
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const taxesById = new Map(taxes.map((tax) => [tax.id, tax]));

    const computedTotals = computeOperationalDocumentTotals(
      input.data.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        tax: line.taxId ? taxesById.get(line.taxId) ?? null : null,
      })),
    );

    const preparedLines = computedTotals.lines.map((computedLine, index) => {
      const originalLine = input.data.lines[index]!;
      const item = originalLine.itemId ? itemsById.get(originalLine.itemId) : null;
      const accountId = originalLine.accountId || item?.defaultLedgerAccountId || null;

      if (!accountId) {
        throw new DomainError(
          `La linea ${index + 1} necesita una cuenta contable o un item con cuenta por defecto.`,
          "MISSING_LINE_ACCOUNT",
        );
      }

      if (!accountsById.has(accountId)) {
        throw new NotFoundError(`La cuenta de la linea ${index + 1} no existe o esta archivada.`);
      }

      return {
        itemId: originalLine.itemId || null,
        accountId,
        taxId: computedLine.taxId,
        description: computedLine.description,
        quantity: new Prisma.Decimal(computedLine.quantity.toString()),
        unitPrice: new Prisma.Decimal(computedLine.unitPrice.toString()),
        lineSubtotal: new Prisma.Decimal(computedLine.lineSubtotal.toString()),
        taxableBase: new Prisma.Decimal(computedLine.taxableBase.toString()),
        taxAmount: new Prisma.Decimal(computedLine.taxAmount.toString()),
        lineTotal: new Prisma.Decimal(computedLine.lineTotal.toString()),
      };
    });

    const record = await salesRepository.saveDraft(
      {
        organizationId: input.organizationId,
        currencyId: organization.baseCurrencyId,
        customerId: input.data.customerId,
        issueDate: new Date(`${input.data.issueDate}T12:00:00.000Z`),
        dueDate: input.data.dueDate ? new Date(`${input.data.dueDate}T12:00:00.000Z`) : null,
        notes: sanitizeOptional(input.data.notes),
        subtotal: new Prisma.Decimal(normalizeMoney(computedTotals.subtotal).toString()),
        taxTotal: new Prisma.Decimal(normalizeMoney(computedTotals.taxTotal).toString()),
        withholdingTotal: new Prisma.Decimal(normalizeMoney(computedTotals.withholdingTotal).toString()),
        total: new Prisma.Decimal(normalizeMoney(computedTotals.total).toString()),
        balanceDue: new Prisma.Decimal(normalizeMoney(computedTotals.balanceDue).toString()),
        lines: preparedLines,
        invoiceId: input.data.id,
        expectedVersion: input.data.version,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.data.id ? "UPDATED" : "CREATED",
        entityType: "SalesInvoice",
        entityId: record.id,
        correlationId: input.correlationId,
        afterState: {
          internalNumber: record.internalNumber,
          customerId: record.customerId,
          status: record.status,
          total: record.total.toString(),
        },
      },
      tx,
    );

    return record;
  });
}
