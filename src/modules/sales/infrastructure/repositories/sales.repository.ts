import { randomUUID } from "node:crypto";

import { Prisma, PrismaClient } from "@prisma/client";

import type { DocumentListFilters } from "@/modules/shared/dto/document-management.dto";
import { prisma } from "@/lib/prisma/client";
import { DomainError, NotFoundError } from "@/lib/errors";

type SalesDbClient = Prisma.TransactionClient | PrismaClient;

const PAGE_SIZE = 10;

function getSkip(page: number) {
  return (page - 1) * PAGE_SIZE;
}

function buildDraftInternalNumber(prefix: string) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-DRAFT-${datePart}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export const salesRepository = {
  pageSize: PAGE_SIZE,

  async listInvoices(input: { organizationId: string; filters: DocumentListFilters }) {
    const q = input.filters.q.trim();
    const where: Prisma.SalesInvoiceWhereInput = {
      organizationId: input.organizationId,
      deletedAt: null,
      status: input.filters.status === "ALL" ? undefined : input.filters.status,
      OR: q
        ? [
            { internalNumber: { contains: q, mode: "insensitive" } },
            { documentNumber: { contains: q, mode: "insensitive" } },
            { customer: { code: { contains: q, mode: "insensitive" } } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.salesInvoice.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          paymentAllocations: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              lines: true,
            },
          },
        },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    const journalEntries = rows.length
      ? await prisma.journalEntry.findMany({
          where: {
            organizationId: input.organizationId,
            sourceType: "SALES_INVOICE",
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

  async listFormDependencies(organizationId: string) {
    const [customers, items, accounts, taxes] = await prisma.$transaction([
      prisma.thirdParty.findMany({
        where: {
          organizationId,
          deletedAt: null,
          type: "CUSTOMER",
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      prisma.catalogItem.findMany({
        where: {
          organizationId,
          deletedAt: null,
          isActive: true,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          defaultLedgerAccountId: true,
          defaultTaxId: true,
        },
      }),
      prisma.ledgerAccount.findMany({
        where: {
          organizationId,
          deletedAt: null,
          isPosting: true,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      prisma.tax.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          rate: true,
          isWithholding: true,
        },
      }),
    ]);

    return {
      customers,
      items,
      accounts,
      taxes,
    };
  },

  async findCustomerById(organizationId: string, customerId: string, db: SalesDbClient = prisma) {
    return db.thirdParty.findFirst({
      where: {
        organizationId,
        id: customerId,
        deletedAt: null,
        type: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
      },
    });
  },

  async findItemsByIds(organizationId: string, ids: string[], db: SalesDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.catalogItem.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        defaultLedgerAccountId: true,
        defaultTaxId: true,
      },
    });
  },

  async findAccountsByIds(organizationId: string, ids: string[], db: SalesDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.ledgerAccount.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
        isPosting: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  },

  async findTaxesByIds(organizationId: string, ids: string[], db: SalesDbClient = prisma) {
    if (!ids.length) {
      return [];
    }

    return db.tax.findMany({
      where: {
        organizationId,
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        rate: true,
        isWithholding: true,
      },
    });
  },

  async findInvoiceById(
    input: { organizationId: string; invoiceId: string },
    db: SalesDbClient = prisma,
  ) {
    return db.salesInvoice.findFirst({
      where: {
        organizationId: input.organizationId,
        id: input.invoiceId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        lines: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            account: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            tax: {
              select: {
                id: true,
                code: true,
                rate: true,
                isWithholding: true,
              },
            },
          },
        },
        paymentAllocations: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });
  },

  async saveDraft(
    input: {
      organizationId: string;
      currencyId: string;
      customerId: string;
      issueDate: Date;
      dueDate?: Date | null;
      notes?: string | null;
      subtotal: Prisma.Decimal;
      taxTotal: Prisma.Decimal;
      withholdingTotal: Prisma.Decimal;
      total: Prisma.Decimal;
      balanceDue: Prisma.Decimal;
      lines: Array<{
        itemId?: string | null;
        accountId?: string | null;
        taxId?: string | null;
        description: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        lineSubtotal: Prisma.Decimal;
        taxableBase: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }>;
      invoiceId?: string;
      expectedVersion?: number;
    },
    db: SalesDbClient,
  ) {
    if (!input.invoiceId) {
      return db.salesInvoice.create({
        data: {
          organizationId: input.organizationId,
          customerId: input.customerId,
          currencyId: input.currencyId,
          internalNumber: buildDraftInternalNumber("SI"),
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
          subtotal: input.subtotal,
          taxTotal: input.taxTotal,
          withholdingTotal: input.withholdingTotal,
          total: input.total,
          balanceDue: input.balanceDue,
          lines: {
            create: input.lines,
          },
        },
      });
    }

    const current = await db.salesInvoice.findUnique({
      where: { id: input.invoiceId },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos la factura de venta solicitada.");
    }

    if (current.status !== "DRAFT") {
      throw new DomainError("Solo puedes editar facturas en borrador.", "DOCUMENT_NOT_DRAFT");
    }

    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new DomainError(
        "La factura cambio mientras la editabas. Recarga e intenta de nuevo.",
        "DOCUMENT_VERSION_CONFLICT",
      );
    }

    return db.salesInvoice.update({
      where: { id: input.invoiceId },
      data: {
        customerId: input.customerId,
        issueDate: input.issueDate,
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null,
        subtotal: input.subtotal,
        taxTotal: input.taxTotal,
        withholdingTotal: input.withholdingTotal,
        total: input.total,
        balanceDue: input.balanceDue,
        version: {
          increment: 1,
        },
        lines: {
          deleteMany: {},
          create: input.lines,
        },
      },
    });
  },

  async markPosted(
    input: {
      invoiceId: string;
      documentNumber: string;
      postedAt: Date;
    },
    db: SalesDbClient,
  ) {
    return db.salesInvoice.update({
      where: { id: input.invoiceId },
      data: {
        documentNumber: input.documentNumber,
        status: "POSTED",
        postedAt: input.postedAt,
        version: {
          increment: 1,
        },
      },
    });
  },

  async markVoided(
    input: {
      invoiceId: string;
      voidedAt: Date;
      voidReason: string;
    },
    db: SalesDbClient,
  ) {
    return db.salesInvoice.update({
      where: { id: input.invoiceId },
      data: {
        status: "VOIDED",
        voidedAt: input.voidedAt,
        voidReason: input.voidReason,
        balanceDue: new Prisma.Decimal("0.00"),
        version: {
          increment: 1,
        },
      },
    });
  },

  async applyAllocation(
    input: {
      invoiceId: string;
      amount: Prisma.Decimal;
      increment?: boolean;
    },
    db: SalesDbClient,
  ) {
    const current = await db.salesInvoice.findUnique({
      where: { id: input.invoiceId },
      select: {
        id: true,
        balanceDue: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos la factura de venta a aplicar.");
    }

    const nextBalance = input.increment
      ? current.balanceDue.plus(input.amount)
      : current.balanceDue.minus(input.amount);

    return db.salesInvoice.update({
      where: { id: input.invoiceId },
      data: {
        balanceDue: nextBalance,
        version: {
          increment: 1,
        },
      },
    });
  },
};
