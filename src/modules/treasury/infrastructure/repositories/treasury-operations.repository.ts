import { randomUUID } from "node:crypto";

import Decimal from "decimal.js";
import { Prisma, PrismaClient } from "@prisma/client";

import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";
import type {
  ReconciliationFilterValues,
  StatementImportFilterValues,
  TreasuryDocumentFilterValues,
} from "@/modules/treasury/validators/treasury-operations.validator";

type TreasuryDbClient = Prisma.TransactionClient | PrismaClient;

const PAGE_SIZE = 10;

function getSkip(page: number) {
  return (page - 1) * PAGE_SIZE;
}

function buildDraftReference(prefix: string) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-DRAFT-${datePart}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function matchStatus(status: TreasuryDocumentFilterValues["status"]) {
  return status === "ALL" ? undefined : status;
}

export const treasuryOperationsRepository = {
  pageSize: PAGE_SIZE,

  async listPayments(input: {
    organizationId: string;
    filters: TreasuryDocumentFilterValues;
  }) {
    const q = input.filters.q.trim();
    const where: Prisma.PaymentWhereInput = {
      organizationId: input.organizationId,
      deletedAt: null,
      status: matchStatus(input.filters.status),
      direction: input.filters.direction === "ALL" ? undefined : input.filters.direction,
      OR: q
        ? [
            { reference: { contains: q, mode: "insensitive" } },
            { thirdParty: { code: { contains: q, mode: "insensitive" } } },
            { thirdParty: { name: { contains: q, mode: "insensitive" } } },
            { method: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          thirdParty: { select: { name: true } },
          method: { select: { name: true } },
          bankAccount: { select: { name: true } },
          cashAccount: { select: { name: true } },
          allocations: { select: { id: true } },
        },
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.payment.count({ where }),
    ]);

    const journalEntries = rows.length
      ? await prisma.journalEntry.findMany({
          where: {
            organizationId: input.organizationId,
            sourceType: "PAYMENT",
            sourceId: {
              in: rows.map((row) => row.id),
            },
          },
          select: {
            sourceId: true,
            entryNumber: true,
          },
        })
      : [];

    const journalNumbersBySourceId = new Map(
      journalEntries.map((entry) => [entry.sourceId, entry.entryNumber]),
    );

    return {
      rows: rows.map((row) => ({
        ...row,
        journalEntryNumber: journalNumbersBySourceId.get(row.id) ?? null,
      })),
      totalItems,
    };
  },

  async listTransfers(input: {
    organizationId: string;
    filters: TreasuryDocumentFilterValues;
  }) {
    const q = input.filters.q.trim();
    const where: Prisma.TransferWhereInput = {
      organizationId: input.organizationId,
      status: matchStatus(input.filters.status),
      OR: q
        ? [
            { reference: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            { sourceBankAccount: { name: { contains: q, mode: "insensitive" } } },
            { destinationBankAccount: { name: { contains: q, mode: "insensitive" } } },
            { sourceCashAccount: { name: { contains: q, mode: "insensitive" } } },
            { destinationCashAccount: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.transfer.findMany({
        where,
        include: {
          sourceBankAccount: { select: { name: true } },
          sourceCashAccount: { select: { name: true } },
          destinationBankAccount: { select: { name: true } },
          destinationCashAccount: { select: { name: true } },
        },
        orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.transfer.count({ where }),
    ]);

    const journalEntries = rows.length
      ? await prisma.journalEntry.findMany({
          where: {
            organizationId: input.organizationId,
            sourceType: "TRANSFER",
            sourceId: {
              in: rows.map((row) => row.id),
            },
          },
          select: {
            sourceId: true,
            entryNumber: true,
          },
        })
      : [];

    const journalNumbersBySourceId = new Map(
      journalEntries.map((entry) => [entry.sourceId, entry.entryNumber]),
    );

    return {
      rows: rows.map((row) => ({
        ...row,
        journalEntryNumber: journalNumbersBySourceId.get(row.id) ?? null,
      })),
      totalItems,
    };
  },

  async listStatementImports(input: {
    organizationId: string;
    filters: StatementImportFilterValues;
  }) {
    const where: Prisma.BankStatementImportWhereInput = {
      organizationId: input.organizationId,
      status: input.filters.status === "ALL" ? undefined : input.filters.status,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.bankStatementImport.findMany({
        where,
        include: {
          bankAccount: { select: { name: true } },
          lines: {
            orderBy: [{ transactionDate: "desc" }],
            take: 3,
            select: {
              id: true,
              transactionDate: true,
              description: true,
              amount: true,
              balance: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.bankStatementImport.count({ where }),
    ]);

    return {
      rows,
      totalItems,
    };
  },

  async listReconciliations(input: {
    organizationId: string;
    filters: ReconciliationFilterValues;
  }) {
    const where: Prisma.ReconciliationWhereInput = {
      organizationId: input.organizationId,
      status: input.filters.status === "ALL" ? undefined : input.filters.status,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.reconciliation.findMany({
        where,
        include: {
          bankAccount: { select: { name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.reconciliation.count({ where }),
    ]);

    return {
      rows,
      totalItems,
    };
  },

  async listPaymentFormDependencies(organizationId: string) {
    const [thirdParties, methods, bankAccounts, cashAccounts, openSalesInvoices, openPurchaseBills, openExpenses] =
      await prisma.$transaction([
        prisma.thirdParty.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.paymentMethod.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.bankAccount.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.cashAccount.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.salesInvoice.findMany({
          where: {
            organizationId,
            deletedAt: null,
            status: "POSTED",
            balanceDue: {
              gt: new Prisma.Decimal("0.00"),
            },
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ dueDate: "asc" }, { issueDate: "desc" }],
        }),
        prisma.purchaseBill.findMany({
          where: {
            organizationId,
            deletedAt: null,
            status: "POSTED",
            balanceDue: {
              gt: new Prisma.Decimal("0.00"),
            },
          },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ dueDate: "asc" }, { issueDate: "desc" }],
        }),
        prisma.expense.findMany({
          where: {
            organizationId,
            deletedAt: null,
            status: "POSTED",
            balanceDue: {
              gt: new Prisma.Decimal("0.00"),
            },
          },
          include: {
            thirdParty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ expenseDate: "desc" }],
        }),
      ]);

    return {
      thirdParties,
      methods,
      bankAccounts,
      cashAccounts,
      openDocuments: [
        ...openSalesInvoices.map((invoice) => ({
          value: invoice.id,
          label: `${invoice.documentNumber ?? invoice.internalNumber} · ${invoice.customer.name}`,
          documentType: "SALES_INVOICE" as const,
          thirdPartyId: invoice.customerId,
          balanceDue: invoice.balanceDue.toString(),
        })),
        ...openPurchaseBills.map((bill) => ({
          value: bill.id,
          label: `${bill.documentNumber ?? bill.internalNumber} · ${bill.supplier.name}`,
          documentType: "PURCHASE_BILL" as const,
          thirdPartyId: bill.supplierId,
          balanceDue: bill.balanceDue.toString(),
        })),
        ...openExpenses.map((expense) => ({
          value: expense.id,
          label: `${expense.documentNumber ?? expense.internalNumber} · ${expense.thirdParty?.name ?? "Sin tercero"}`,
          documentType: "EXPENSE" as const,
          thirdPartyId: expense.thirdPartyId,
          balanceDue: expense.balanceDue.toString(),
        })),
      ],
    };
  },

  async listTransferFormDependencies(organizationId: string) {
    const [bankAccounts, cashAccounts] = await prisma.$transaction([
      prisma.bankAccount.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      prisma.cashAccount.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
    ]);

    return {
      bankAccounts,
      cashAccounts,
    };
  },

  async listStatementImportDependencies(organizationId: string) {
    return prisma.bankAccount.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  },

  async listReconciliationDependencies(organizationId: string) {
    return prisma.bankAccount.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: [{ code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  },

  async findPaymentById(input: { organizationId: string; paymentId: string }, db: TreasuryDbClient = prisma) {
    return db.payment.findFirst({
      where: {
        organizationId: input.organizationId,
        id: input.paymentId,
      },
      include: {
        allocations: true,
      },
    });
  },

  async findTransferById(input: { organizationId: string; transferId: string }, db: TreasuryDbClient = prisma) {
    return db.transfer.findFirst({
      where: {
        organizationId: input.organizationId,
        id: input.transferId,
      },
    });
  },

  async findStatementImportById(
    input: { organizationId: string; importId: string },
    db: TreasuryDbClient = prisma,
  ) {
    return db.bankStatementImport.findFirst({
      where: {
        organizationId: input.organizationId,
        id: input.importId,
      },
      include: {
        lines: {
          orderBy: [{ transactionDate: "asc" }],
        },
      },
    });
  },

  async findReconciliationById(
    input: { organizationId: string; reconciliationId: string },
    db: TreasuryDbClient = prisma,
  ) {
    return db.reconciliation.findFirst({
      where: {
        organizationId: input.organizationId,
        id: input.reconciliationId,
      },
      include: {
        bankAccount: true,
        lines: true,
      },
    });
  },

  async savePaymentDraft(
    input: {
      organizationId: string;
      currencyId: string;
      thirdPartyId?: string | null;
      methodId: string;
      bankAccountId?: string | null;
      cashAccountId?: string | null;
      direction: "RECEIVED" | "SENT";
      paymentDate: Date;
      amount: Prisma.Decimal;
      reference?: string | null;
      notes?: string | null;
      allocations: Array<{
        salesInvoiceId?: string | null;
        purchaseBillId?: string | null;
        expenseId?: string | null;
        amount: Prisma.Decimal;
      }>;
      paymentId?: string;
      expectedVersion?: number;
    },
    db: TreasuryDbClient,
  ) {
    if (!input.paymentId) {
      return db.payment.create({
        data: {
          organizationId: input.organizationId,
          thirdPartyId: input.thirdPartyId ?? null,
          methodId: input.methodId,
          bankAccountId: input.bankAccountId ?? null,
          cashAccountId: input.cashAccountId ?? null,
          currencyId: input.currencyId,
          direction: input.direction,
          reference: input.reference?.trim() || buildDraftReference("PM"),
          paymentDate: input.paymentDate,
          amount: input.amount,
          notes: input.notes ?? null,
          allocations: {
            create: input.allocations,
          },
        },
      });
    }

    const current = await db.payment.findUnique({
      where: {
        id: input.paymentId,
      },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos el pago solicitado.");
    }

    if (current.status !== "DRAFT") {
      throw new DomainError("Solo puedes editar pagos en borrador.", "DOCUMENT_NOT_DRAFT");
    }

    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new DomainError(
        "El pago cambio mientras lo editabas. Recarga e intenta de nuevo.",
        "DOCUMENT_VERSION_CONFLICT",
      );
    }

    return db.payment.update({
      where: {
        id: input.paymentId,
      },
      data: {
        thirdPartyId: input.thirdPartyId ?? null,
        methodId: input.methodId,
        bankAccountId: input.bankAccountId ?? null,
        cashAccountId: input.cashAccountId ?? null,
        direction: input.direction,
        paymentDate: input.paymentDate,
        amount: input.amount,
        reference: input.reference?.trim() || current.id,
        notes: input.notes ?? null,
        version: {
          increment: 1,
        },
        allocations: {
          deleteMany: {},
          create: input.allocations,
        },
      },
    });
  },

  async markPaymentPosted(
    input: {
      paymentId: string;
      reference: string;
      postedAt: Date;
    },
    db: TreasuryDbClient,
  ) {
    return db.payment.update({
      where: { id: input.paymentId },
      data: {
        reference: input.reference,
        status: "POSTED",
        postedAt: input.postedAt,
        version: {
          increment: 1,
        },
      },
    });
  },

  async markPaymentVoided(
    input: {
      paymentId: string;
      voidedAt: Date;
      voidReason: string;
    },
    db: TreasuryDbClient,
  ) {
    return db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: "VOIDED",
        voidedAt: input.voidedAt,
        voidReason: input.voidReason,
        version: {
          increment: 1,
        },
      },
    });
  },

  async saveTransferDraft(
    input: {
      organizationId: string;
      currencyId: string;
      sourceBankAccountId?: string | null;
      sourceCashAccountId?: string | null;
      destinationBankAccountId?: string | null;
      destinationCashAccountId?: string | null;
      transferDate: Date;
      amount: Prisma.Decimal;
      reference?: string | null;
      notes?: string | null;
      transferId?: string;
      expectedVersion?: number;
    },
    db: TreasuryDbClient,
  ) {
    if (!input.transferId) {
      return db.transfer.create({
        data: {
          organizationId: input.organizationId,
          currencyId: input.currencyId,
          sourceBankAccountId: input.sourceBankAccountId ?? null,
          sourceCashAccountId: input.sourceCashAccountId ?? null,
          destinationBankAccountId: input.destinationBankAccountId ?? null,
          destinationCashAccountId: input.destinationCashAccountId ?? null,
          transferDate: input.transferDate,
          amount: input.amount,
          reference: input.reference?.trim() || buildDraftReference("TR"),
          notes: input.notes ?? null,
        },
      });
    }

    const current = await db.transfer.findUnique({
      where: {
        id: input.transferId,
      },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos el traslado solicitado.");
    }

    if (current.status !== "DRAFT") {
      throw new DomainError("Solo puedes editar traslados en borrador.", "DOCUMENT_NOT_DRAFT");
    }

    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new DomainError(
        "El traslado cambio mientras lo editabas. Recarga e intenta de nuevo.",
        "DOCUMENT_VERSION_CONFLICT",
      );
    }

    return db.transfer.update({
      where: { id: input.transferId },
      data: {
        sourceBankAccountId: input.sourceBankAccountId ?? null,
        sourceCashAccountId: input.sourceCashAccountId ?? null,
        destinationBankAccountId: input.destinationBankAccountId ?? null,
        destinationCashAccountId: input.destinationCashAccountId ?? null,
        transferDate: input.transferDate,
        amount: input.amount,
        reference: input.reference?.trim() || current.id,
        notes: input.notes ?? null,
        version: {
          increment: 1,
        },
      },
    });
  },

  async markTransferPosted(
    input: {
      transferId: string;
      reference: string;
      postedAt: Date;
    },
    db: TreasuryDbClient,
  ) {
    return db.transfer.update({
      where: { id: input.transferId },
      data: {
        reference: input.reference,
        status: "POSTED",
        postedAt: input.postedAt,
        version: {
          increment: 1,
        },
      },
    });
  },

  async markTransferVoided(
    input: {
      transferId: string;
      voidedAt: Date;
      voidReason: string;
    },
    db: TreasuryDbClient,
  ) {
    return db.transfer.update({
      where: { id: input.transferId },
      data: {
        status: "VOIDED",
        voidedAt: input.voidedAt,
        voidReason: input.voidReason,
        version: {
          increment: 1,
        },
      },
    });
  },

  async createStatementImport(
    input: {
      organizationId: string;
      bankAccountId: string;
      attachmentId?: string | null;
      fileName: string;
    },
    db: TreasuryDbClient,
  ) {
    return db.bankStatementImport.create({
      data: {
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        attachmentId: input.attachmentId ?? null,
        fileName: input.fileName,
      },
    });
  },

  async markStatementImportProcessing(importId: string, db: TreasuryDbClient) {
    return db.bankStatementImport.update({
      where: { id: importId },
      data: {
        status: "PROCESSING",
      },
    });
  },

  async replaceStatementImportLines(
    input: {
      importId: string;
      organizationId: string;
      bankAccountId: string;
      rows: Array<{
        transactionDate: Date;
        description: string;
        reference?: string | null;
        amount: Prisma.Decimal;
        balance?: Prisma.Decimal | null;
      }>;
    },
    db: TreasuryDbClient,
  ) {
    await db.bankStatementLine.deleteMany({
      where: {
        bankStatementImportId: input.importId,
      },
    });

    if (input.rows.length === 0) {
      return;
    }

    await db.bankStatementLine.createMany({
      data: input.rows.map((row) => ({
        organizationId: input.organizationId,
        bankStatementImportId: input.importId,
        bankAccountId: input.bankAccountId,
        transactionDate: row.transactionDate,
        description: row.description,
        reference: row.reference ?? null,
        amount: row.amount,
        balance: row.balance ?? null,
      })),
    });
  },

  async markStatementImportCompleted(
    input: {
      importId: string;
      importedAt: Date;
      rowsCount: number;
    },
    db: TreasuryDbClient,
  ) {
    return db.bankStatementImport.update({
      where: { id: input.importId },
      data: {
        status: "COMPLETED",
        importedAt: input.importedAt,
        rowsCount: input.rowsCount,
      },
    });
  },

  async markStatementImportFailed(importId: string, db: TreasuryDbClient) {
    return db.bankStatementImport.update({
      where: { id: importId },
      data: {
        status: "FAILED",
      },
    });
  },

  async createReconciliation(
    input: {
      organizationId: string;
      bankAccountId: string;
      periodStart: Date;
      periodEnd: Date;
      statementBalance: Prisma.Decimal;
      bookBalance: Prisma.Decimal;
      notes?: string | null;
    },
    db: TreasuryDbClient,
  ) {
    return db.reconciliation.create({
      data: {
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        statementBalance: input.statementBalance,
        bookBalance: input.bookBalance,
        notes: input.notes ?? null,
        status: "DRAFT",
      },
    });
  },

  async completeReconciliation(
    input: {
      reconciliationId: string;
      organizationId: string;
      lines: Array<{
        bankStatementLineId: string;
        matchedDocumentType: string;
        matchedDocumentId: string;
        matchedAmount: Prisma.Decimal;
        notes?: string | null;
      }>;
    },
    db: TreasuryDbClient,
  ) {
    await db.reconciliationLine.deleteMany({
      where: {
        reconciliationId: input.reconciliationId,
      },
    });

    await db.reconciliationLine.createMany({
      data: input.lines.map((line) => ({
        organizationId: input.organizationId,
        reconciliationId: input.reconciliationId,
        bankStatementLineId: line.bankStatementLineId,
        matchedDocumentType: line.matchedDocumentType,
        matchedDocumentId: line.matchedDocumentId,
        matchedAmount: line.matchedAmount,
        notes: line.notes ?? null,
      })),
    });

    return db.reconciliation.update({
      where: { id: input.reconciliationId },
      data: {
        status: "COMPLETED",
      },
    });
  },

  async listUnreconciledBankStatementLines(input: {
    organizationId: string;
    bankAccountId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    return prisma.bankStatementLine.findMany({
      where: {
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        transactionDate: {
          gte: input.periodStart,
          lte: input.periodEnd,
        },
        reconciliationLines: {
          none: {},
        },
      },
      orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
    });
  },

  async listPostedBankDocumentsForMatching(input: {
    organizationId: string;
    bankAccountId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const searchStart = new Date(input.periodStart);
    searchStart.setUTCDate(searchStart.getUTCDate() - 7);

    const searchEnd = new Date(input.periodEnd);
    searchEnd.setUTCDate(searchEnd.getUTCDate() + 7);

    const [payments, outgoingTransfers, incomingTransfers] = await prisma.$transaction([
      prisma.payment.findMany({
        where: {
          organizationId: input.organizationId,
          bankAccountId: input.bankAccountId,
          status: "POSTED",
          paymentDate: {
            gte: searchStart,
            lte: searchEnd,
          },
        },
        include: {
          thirdParty: { select: { name: true } },
        },
      }),
      prisma.transfer.findMany({
        where: {
          organizationId: input.organizationId,
          sourceBankAccountId: input.bankAccountId,
          status: "POSTED",
          transferDate: {
            gte: searchStart,
            lte: searchEnd,
          },
        },
      }),
      prisma.transfer.findMany({
        where: {
          organizationId: input.organizationId,
          destinationBankAccountId: input.bankAccountId,
          status: "POSTED",
          transferDate: {
            gte: searchStart,
            lte: searchEnd,
          },
        },
      }),
    ]);

    return {
      payments,
      outgoingTransfers,
      incomingTransfers,
    };
  },

  async computeTreasuryBalances(organizationId: string, upTo?: Date) {
    const [bankAccounts, cashAccounts, payments, sourceTransfers, destinationTransfers] =
      await prisma.$transaction([
        prisma.bankAccount.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.cashAccount.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            organizationId,
            status: "POSTED",
            paymentDate: upTo ? { lte: upTo } : undefined,
          },
          select: {
            bankAccountId: true,
            cashAccountId: true,
            direction: true,
            amount: true,
          },
        }),
        prisma.transfer.findMany({
          where: {
            organizationId,
            status: "POSTED",
            transferDate: upTo ? { lte: upTo } : undefined,
          },
          select: {
            sourceBankAccountId: true,
            sourceCashAccountId: true,
            amount: true,
          },
        }),
        prisma.transfer.findMany({
          where: {
            organizationId,
            status: "POSTED",
            transferDate: upTo ? { lte: upTo } : undefined,
          },
          select: {
            destinationBankAccountId: true,
            destinationCashAccountId: true,
            amount: true,
          },
        }),
      ]);

    const bankBalances = new Map(bankAccounts.map((account) => [account.id, new Decimal(0)]));
    const cashBalances = new Map(cashAccounts.map((account) => [account.id, new Decimal(0)]));

    for (const payment of payments) {
      const delta =
        payment.direction === "RECEIVED"
          ? new Decimal(payment.amount)
          : new Decimal(payment.amount).negated();

      if (payment.bankAccountId && bankBalances.has(payment.bankAccountId)) {
        bankBalances.set(payment.bankAccountId, bankBalances.get(payment.bankAccountId)!.plus(delta));
      }

      if (payment.cashAccountId && cashBalances.has(payment.cashAccountId)) {
        cashBalances.set(payment.cashAccountId, cashBalances.get(payment.cashAccountId)!.plus(delta));
      }
    }

    for (const transfer of sourceTransfers) {
      const delta = new Decimal(transfer.amount).negated();

      if (transfer.sourceBankAccountId && bankBalances.has(transfer.sourceBankAccountId)) {
        bankBalances.set(
          transfer.sourceBankAccountId,
          bankBalances.get(transfer.sourceBankAccountId)!.plus(delta),
        );
      }

      if (transfer.sourceCashAccountId && cashBalances.has(transfer.sourceCashAccountId)) {
        cashBalances.set(
          transfer.sourceCashAccountId,
          cashBalances.get(transfer.sourceCashAccountId)!.plus(delta),
        );
      }
    }

    for (const transfer of destinationTransfers) {
      const delta = new Decimal(transfer.amount);

      if (transfer.destinationBankAccountId && bankBalances.has(transfer.destinationBankAccountId)) {
        bankBalances.set(
          transfer.destinationBankAccountId,
          bankBalances.get(transfer.destinationBankAccountId)!.plus(delta),
        );
      }

      if (transfer.destinationCashAccountId && cashBalances.has(transfer.destinationCashAccountId)) {
        cashBalances.set(
          transfer.destinationCashAccountId,
          cashBalances.get(transfer.destinationCashAccountId)!.plus(delta),
        );
      }
    }

    return {
      bankBalances: bankAccounts.map((account) => ({
        ...account,
        balance: normalizeMoney(bankBalances.get(account.id) ?? 0).toString(),
      })),
      cashBalances: cashAccounts.map((account) => ({
        ...account,
        balance: normalizeMoney(cashBalances.get(account.id) ?? 0).toString(),
      })),
    };
  },

  async computeBankBookBalance(input: {
    organizationId: string;
    bankAccountId: string;
    periodEnd: Date;
  }) {
    const balances = await this.computeTreasuryBalances(input.organizationId, input.periodEnd);
    const bankBalance = balances.bankBalances.find((account) => account.id === input.bankAccountId);
    return new Prisma.Decimal(bankBalance?.balance ?? "0.00");
  },

  async computeStatementBalance(input: {
    organizationId: string;
    bankAccountId: string;
    periodEnd: Date;
  }) {
    const latestLine = await prisma.bankStatementLine.findFirst({
      where: {
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        transactionDate: { lte: input.periodEnd },
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      select: {
        balance: true,
      },
    });

    if (latestLine?.balance) {
      return latestLine.balance;
    }

    const aggregate = await prisma.bankStatementLine.aggregate({
      where: {
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        transactionDate: { lte: input.periodEnd },
      },
      _sum: {
        amount: true,
      },
    });

    return aggregate._sum.amount ?? new Prisma.Decimal("0.00");
  },

  async findBankAccountById(organizationId: string, bankAccountId: string, db: TreasuryDbClient = prisma) {
    return db.bankAccount.findFirst({
      where: {
        organizationId,
        id: bankAccountId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  },

  async findCashAccountById(organizationId: string, cashAccountId: string, db: TreasuryDbClient = prisma) {
    return db.cashAccount.findFirst({
      where: {
        organizationId,
        id: cashAccountId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  },

  async findPaymentMethodById(organizationId: string, methodId: string, db: TreasuryDbClient = prisma) {
    return db.paymentMethod.findFirst({
      where: {
        organizationId,
        id: methodId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });
  },

  async findThirdPartyById(organizationId: string, thirdPartyId: string, db: TreasuryDbClient = prisma) {
    return db.thirdParty.findFirst({
      where: {
        organizationId,
        id: thirdPartyId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        name: true,
      },
    });
  },

  async findSalesInvoicesByIds(organizationId: string, ids: string[], db: TreasuryDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.salesInvoice.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
        status: "POSTED",
      },
      select: {
        id: true,
        customerId: true,
        balanceDue: true,
        documentNumber: true,
        internalNumber: true,
      },
    });
  },

  async findPurchaseBillsByIds(organizationId: string, ids: string[], db: TreasuryDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.purchaseBill.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
        status: "POSTED",
      },
      select: {
        id: true,
        supplierId: true,
        balanceDue: true,
        documentNumber: true,
        internalNumber: true,
      },
    });
  },

  async findExpensesByIds(organizationId: string, ids: string[], db: TreasuryDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.expense.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
        status: "POSTED",
      },
      select: {
        id: true,
        thirdPartyId: true,
        balanceDue: true,
        documentNumber: true,
        internalNumber: true,
      },
    });
  },

  async applyExpenseAllocation(
    input: {
      expenseId: string;
      amount: Prisma.Decimal;
      increment?: boolean;
    },
    db: TreasuryDbClient,
  ) {
    const current = await db.expense.findUnique({
      where: { id: input.expenseId },
      select: {
        id: true,
        balanceDue: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos el gasto a aplicar.");
    }

    const nextBalance = input.increment
      ? current.balanceDue.plus(input.amount)
      : current.balanceDue.minus(input.amount);

    return db.expense.update({
      where: { id: input.expenseId },
      data: {
        balanceDue: nextBalance,
        version: {
          increment: 1,
        },
      },
    });
  },
};
