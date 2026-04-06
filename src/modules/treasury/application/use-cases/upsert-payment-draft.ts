import { Prisma } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney, sumMoney } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";
import type { PaymentFormValues } from "@/modules/treasury/validators/treasury-operations.validator";

type UpsertPaymentDraftInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: PaymentFormValues;
};

async function resolveDraftAllocations(
  organizationId: string,
  data: PaymentFormValues,
  db: Prisma.TransactionClient,
) {
  const amount = normalizeMoney(data.amount.replace(",", "."));
  const salesInvoiceIds = data.allocations
    .filter((allocation) => allocation.documentType === "SALES_INVOICE")
    .map((allocation) => allocation.documentId);
  const purchaseBillIds = data.allocations
    .filter((allocation) => allocation.documentType === "PURCHASE_BILL")
    .map((allocation) => allocation.documentId);
  const expenseIds = data.allocations
    .filter((allocation) => allocation.documentType === "EXPENSE")
    .map((allocation) => allocation.documentId);

  const [salesInvoices, purchaseBills, expenses] = await Promise.all([
    treasuryOperationsRepository.findSalesInvoicesByIds(organizationId, salesInvoiceIds, db),
    treasuryOperationsRepository.findPurchaseBillsByIds(organizationId, purchaseBillIds, db),
    treasuryOperationsRepository.findExpensesByIds(organizationId, expenseIds, db),
  ]);

  const salesById = new Map(salesInvoices.map((item) => [item.id, item]));
  const purchaseById = new Map(purchaseBills.map((item) => [item.id, item]));
  const expenseById = new Map(expenses.map((item) => [item.id, item]));

  const normalizedAllocations = data.allocations.map((allocation) => {
    const allocationAmount = normalizeMoney(allocation.amount.replace(",", "."));

    if (allocation.documentType === "SALES_INVOICE") {
      if (data.direction !== "RECEIVED") {
        throw new DomainError(
          "Solo los pagos recibidos pueden aplicarse a facturas de venta.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      const invoice = salesById.get(allocation.documentId);
      if (!invoice) {
        throw new DomainError(
          "Una de las facturas seleccionadas ya no esta disponible.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      if (invoice.balanceDue.lt(allocationAmount)) {
        throw new DomainError(
          "El monto aplicado supera el saldo pendiente de la factura.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      return {
        thirdPartyId: invoice.customerId,
        salesInvoiceId: invoice.id,
        purchaseBillId: null,
        expenseId: null,
        amount: new Prisma.Decimal(allocationAmount.toString()),
      };
    }

    if (allocation.documentType === "PURCHASE_BILL") {
      if (data.direction !== "SENT") {
        throw new DomainError(
          "Solo los pagos salientes pueden aplicarse a cuentas por pagar.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      const bill = purchaseById.get(allocation.documentId);
      if (!bill) {
        throw new DomainError(
          "Una de las facturas proveedor seleccionadas ya no esta disponible.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      if (bill.balanceDue.lt(allocationAmount)) {
        throw new DomainError(
          "El monto aplicado supera el saldo pendiente de la factura proveedor.",
          "INVALID_PAYMENT_ALLOCATION",
        );
      }

      return {
        thirdPartyId: bill.supplierId,
        salesInvoiceId: null,
        purchaseBillId: bill.id,
        expenseId: null,
        amount: new Prisma.Decimal(allocationAmount.toString()),
      };
    }

    if (data.direction !== "SENT") {
      throw new DomainError(
        "Solo los pagos salientes pueden aplicarse a gastos.",
        "INVALID_PAYMENT_ALLOCATION",
      );
    }

    const expense = expenseById.get(allocation.documentId);
    if (!expense) {
      throw new DomainError(
        "Uno de los gastos seleccionados ya no esta disponible.",
        "INVALID_PAYMENT_ALLOCATION",
      );
    }

    if (expense.balanceDue.lt(allocationAmount)) {
      throw new DomainError(
        "El monto aplicado supera el saldo pendiente del gasto.",
        "INVALID_PAYMENT_ALLOCATION",
      );
    }

    return {
      thirdPartyId: expense.thirdPartyId ?? null,
      salesInvoiceId: null,
      purchaseBillId: null,
      expenseId: expense.id,
      amount: new Prisma.Decimal(allocationAmount.toString()),
    };
  });

  const allocatedTotal = sumMoney(normalizedAllocations.map((allocation) => allocation.amount));
  if (!allocatedTotal.equals(amount)) {
    throw new DomainError(
      "La suma de las aplicaciones debe coincidir exactamente con el monto del pago.",
      "PAYMENT_ALLOCATION_MISMATCH",
    );
  }

  const relatedPartyIds = [
    ...new Set(
      normalizedAllocations
        .map((allocation) => allocation.thirdPartyId)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (relatedPartyIds.length > 1) {
    throw new DomainError(
      "Por ahora un pago solo puede aplicarse a documentos del mismo tercero.",
      "MULTIPLE_PARTIES_NOT_SUPPORTED",
    );
  }

  const resolvedThirdPartyId = data.thirdPartyId || relatedPartyIds[0] || null;
  if (data.thirdPartyId && relatedPartyIds[0] && data.thirdPartyId !== relatedPartyIds[0]) {
    throw new DomainError(
      "El tercero del pago no coincide con los documentos aplicados.",
      "THIRD_PARTY_MISMATCH",
    );
  }

  return {
    amount,
    thirdPartyId: resolvedThirdPartyId,
    allocations: normalizedAllocations.map((allocation) => ({
      salesInvoiceId: allocation.salesInvoiceId,
      purchaseBillId: allocation.purchaseBillId,
      expenseId: allocation.expenseId,
      amount: allocation.amount,
    })),
  };
}

export async function upsertPaymentDraft(input: UpsertPaymentDraftInput) {
  const organization = await accountingCoreRepository.getOrganizationContext(input.organizationId);

  return prisma.$transaction(async (tx) => {
    const method = await treasuryOperationsRepository.findPaymentMethodById(
      input.organizationId,
      input.data.methodId,
      tx,
    );

    if (!method) {
      throw new NotFoundError("No encontramos el metodo de pago seleccionado.");
    }

    if (input.data.bankAccountId) {
      const bankAccount = await treasuryOperationsRepository.findBankAccountById(
        input.organizationId,
        input.data.bankAccountId,
        tx,
      );

      if (!bankAccount) {
        throw new NotFoundError("No encontramos la cuenta bancaria seleccionada.");
      }
    }

    if (input.data.cashAccountId) {
      const cashAccount = await treasuryOperationsRepository.findCashAccountById(
        input.organizationId,
        input.data.cashAccountId,
        tx,
      );

      if (!cashAccount) {
        throw new NotFoundError("No encontramos la caja seleccionada.");
      }
    }

    if (input.data.thirdPartyId) {
      const thirdParty = await treasuryOperationsRepository.findThirdPartyById(
        input.organizationId,
        input.data.thirdPartyId,
        tx,
      );

      if (!thirdParty) {
        throw new NotFoundError("No encontramos el tercero seleccionado.");
      }
    }

    const allocationData = await resolveDraftAllocations(input.organizationId, input.data, tx);

    const payment = await treasuryOperationsRepository.savePaymentDraft(
      {
        organizationId: input.organizationId,
        currencyId: organization.baseCurrencyId,
        thirdPartyId: allocationData.thirdPartyId,
        methodId: input.data.methodId,
        bankAccountId: input.data.bankAccountId || null,
        cashAccountId: input.data.cashAccountId || null,
        direction: input.data.direction,
        paymentDate: new Date(input.data.paymentDate),
        amount: new Prisma.Decimal(allocationData.amount.toString()),
        reference: input.data.reference?.trim() || null,
        notes: input.data.notes?.trim() || null,
        allocations: allocationData.allocations,
        paymentId: input.data.id,
        expectedVersion: input.data.version,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.data.id ? "UPDATED" : "CREATED",
        entityType: "Payment",
        entityId: payment.id,
        correlationId: input.correlationId,
        afterState: {
          direction: payment.direction,
          amount: payment.amount.toString(),
          paymentDate: payment.paymentDate.toISOString(),
          reference: payment.reference,
          allocationCount: allocationData.allocations.length,
        },
      },
      tx,
    );

    return payment;
  });
}
