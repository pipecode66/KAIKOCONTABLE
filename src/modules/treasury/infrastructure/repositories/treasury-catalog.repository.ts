import { Prisma, PrismaClient } from "@prisma/client";

import type { CatalogFilters } from "@/modules/shared/dto/catalog-management.dto";
import { prisma } from "@/lib/prisma/client";

type TreasuryDbClient = Prisma.TransactionClient | PrismaClient;

const PAGE_SIZE = 10;

function normalizeQuery(q: string) {
  return q.trim();
}

function getSkip(page: number) {
  return (page - 1) * PAGE_SIZE;
}

export const treasuryCatalogRepository = {
  pageSize: PAGE_SIZE,

  async listPaymentMethods(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.PaymentMethodWhereInput = {
      organizationId: input.organizationId,
      deletedAt:
        input.filters.status === "ALL"
          ? undefined
          : input.filters.status === "ARCHIVED"
            ? { not: null }
            : null,
      OR: q
        ? [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.paymentMethod.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.paymentMethod.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findPaymentMethodById(organizationId: string, id: string, db: TreasuryDbClient = prisma) {
    return db.paymentMethod.findFirst({
      where: { organizationId, id },
    });
  },

  async findPaymentMethodByCode(organizationId: string, code: string, db: TreasuryDbClient = prisma) {
    return db.paymentMethod.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });
  },

  async countPaymentMethodUsages(organizationId: string, id: string) {
    const row = await prisma.paymentMethod.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    return row?._count.payments ?? 0;
  },

  async upsertPaymentMethod(
    organizationId: string,
    data: Omit<Prisma.PaymentMethodUncheckedCreateInput, "organizationId">,
    db: TreasuryDbClient,
  ) {
    if (data.id) {
      return db.paymentMethod.update({
        where: { id: data.id },
        data,
      });
    }

    return db.paymentMethod.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archivePaymentMethod(id: string, db: TreasuryDbClient) {
    return db.paymentMethod.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async listBankAccounts(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.BankAccountWhereInput = {
      organizationId: input.organizationId,
      deletedAt:
        input.filters.status === "ALL"
          ? undefined
          : input.filters.status === "ARCHIVED"
            ? { not: null }
            : null,
      OR: q
        ? [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { bankName: { contains: q, mode: "insensitive" } },
            { accountNumber: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.bankAccount.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.bankAccount.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findBankAccountById(organizationId: string, id: string, db: TreasuryDbClient = prisma) {
    return db.bankAccount.findFirst({
      where: { organizationId, id },
    });
  },

  async findBankAccountByCode(organizationId: string, code: string, db: TreasuryDbClient = prisma) {
    return db.bankAccount.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });
  },

  async countBankAccountUsages(organizationId: string, id: string) {
    const row = await prisma.bankAccount.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            payments: true,
            sourceTransfers: true,
            destinationTransfers: true,
            statementImports: true,
            statementLines: true,
            reconciliations: true,
          },
        },
      },
    });

    if (!row) {
      return 0;
    }

    const count = row._count;
    return (
      count.payments +
      count.sourceTransfers +
      count.destinationTransfers +
      count.statementImports +
      count.statementLines +
      count.reconciliations
    );
  },

  async upsertBankAccount(
    organizationId: string,
    data: Omit<Prisma.BankAccountUncheckedCreateInput, "organizationId">,
    db: TreasuryDbClient,
  ) {
    if (data.id) {
      return db.bankAccount.update({
        where: { id: data.id },
        data,
      });
    }

    return db.bankAccount.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveBankAccount(id: string, db: TreasuryDbClient) {
    return db.bankAccount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async listCashAccounts(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.CashAccountWhereInput = {
      organizationId: input.organizationId,
      deletedAt:
        input.filters.status === "ALL"
          ? undefined
          : input.filters.status === "ARCHIVED"
            ? { not: null }
            : null,
      OR: q
        ? [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.cashAccount.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.cashAccount.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findCashAccountById(organizationId: string, id: string, db: TreasuryDbClient = prisma) {
    return db.cashAccount.findFirst({
      where: { organizationId, id },
    });
  },

  async findCashAccountByCode(organizationId: string, code: string, db: TreasuryDbClient = prisma) {
    return db.cashAccount.findFirst({
      where: { organizationId, code },
      select: { id: true },
    });
  },

  async countCashAccountUsages(organizationId: string, id: string) {
    const row = await prisma.cashAccount.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            payments: true,
            sourceTransfers: true,
            destinationTransfers: true,
            reconciliations: true,
          },
        },
      },
    });

    if (!row) {
      return 0;
    }

    const count = row._count;
    return (
      count.payments +
      count.sourceTransfers +
      count.destinationTransfers +
      count.reconciliations
    );
  },

  async upsertCashAccount(
    organizationId: string,
    data: Omit<Prisma.CashAccountUncheckedCreateInput, "organizationId">,
    db: TreasuryDbClient,
  ) {
    if (data.id) {
      return db.cashAccount.update({
        where: { id: data.id },
        data,
      });
    }

    return db.cashAccount.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveCashAccount(id: string, db: TreasuryDbClient) {
    return db.cashAccount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },
};
