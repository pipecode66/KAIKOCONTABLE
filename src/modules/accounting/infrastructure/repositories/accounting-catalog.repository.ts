import { Prisma, PrismaClient } from "@prisma/client";

import type { CatalogFilters } from "@/modules/shared/dto/catalog-management.dto";
import { prisma } from "@/lib/prisma/client";

type AccountingDbClient = Prisma.TransactionClient | PrismaClient;

const PAGE_SIZE = 10;

function normalizeQuery(q: string) {
  return q.trim();
}

function getSkip(page: number) {
  return (page - 1) * PAGE_SIZE;
}

export const accountingCatalogRepository = {
  pageSize: PAGE_SIZE,

  async listThirdParties(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.ThirdPartyWhereInput = {
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
            { legalName: { contains: q, mode: "insensitive" } },
            { taxId: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.thirdParty.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.thirdParty.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findThirdPartyById(organizationId: string, id: string, db: AccountingDbClient = prisma) {
    return db.thirdParty.findFirst({
      where: {
        organizationId,
        id,
      },
    });
  },

  async findThirdPartyByCode(organizationId: string, code: string, db: AccountingDbClient = prisma) {
    return db.thirdParty.findFirst({
      where: {
        organizationId,
        code,
      },
      select: {
        id: true,
      },
    });
  },

  async countThirdPartyUsages(organizationId: string, id: string) {
    const thirdParty = await prisma.thirdParty.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            salesInvoices: true,
            purchaseBills: true,
            expenses: true,
            payments: true,
            voucherLines: true,
            journalLines: true,
          },
        },
      },
    });

    if (!thirdParty) {
      return 0;
    }

    const count = thirdParty._count;
    return (
      count.salesInvoices +
      count.purchaseBills +
      count.expenses +
      count.payments +
      count.voucherLines +
      count.journalLines
    );
  },

  async upsertThirdParty(
    organizationId: string,
    data: Omit<Prisma.ThirdPartyUncheckedCreateInput, "organizationId">,
    db: AccountingDbClient,
  ) {
    if (data.id) {
      return db.thirdParty.update({
        where: { id: data.id },
        data,
      });
    }

    return db.thirdParty.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveThirdParty(id: string, db: AccountingDbClient) {
    return db.thirdParty.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async listTaxes(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.TaxWhereInput = {
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
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.tax.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.tax.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findTaxById(organizationId: string, id: string, db: AccountingDbClient = prisma) {
    return db.tax.findFirst({
      where: {
        organizationId,
        id,
      },
    });
  },

  async findTaxByCode(organizationId: string, code: string, db: AccountingDbClient = prisma) {
    return db.tax.findFirst({
      where: {
        organizationId,
        code,
      },
      select: {
        id: true,
      },
    });
  },

  async countTaxUsages(organizationId: string, id: string) {
    const tax = await prisma.tax.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            rules: true,
            salesInvoiceLines: true,
            purchaseBillLines: true,
            expenseLines: true,
            catalogItems: true,
          },
        },
      },
    });

    if (!tax) {
      return 0;
    }

    const count = tax._count;
    return (
      count.rules +
      count.salesInvoiceLines +
      count.purchaseBillLines +
      count.expenseLines +
      count.catalogItems
    );
  },

  async upsertTax(
    organizationId: string,
    data: Omit<Prisma.TaxUncheckedCreateInput, "organizationId">,
    db: AccountingDbClient,
  ) {
    if (data.id) {
      return db.tax.update({
        where: { id: data.id },
        data,
      });
    }

    return db.tax.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveTax(id: string, db: AccountingDbClient) {
    return db.tax.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async listTaxRules(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const now = new Date();
    const where: Prisma.TaxRuleWhereInput = {
      organizationId: input.organizationId,
      ...(input.filters.status === "ACTIVE"
        ? {
            OR: [
              {
                effectiveFrom: { lte: now },
                effectiveTo: null,
              },
              {
                effectiveFrom: { lte: now },
                effectiveTo: { gte: now },
              },
            ],
          }
        : input.filters.status === "INACTIVE"
          ? {
              OR: [{ effectiveFrom: { gt: now } }, { effectiveTo: { lt: now } }],
            }
          : {}),
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { documentType: { contains: q, mode: "insensitive" } },
            { operationType: { contains: q, mode: "insensitive" } },
            { municipalityCode: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [rows, totalItems] = await prisma.$transaction([
      prisma.taxRule.findMany({
        where,
        include: {
          tax: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: [{ priority: "asc" }, { effectiveFrom: "desc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.taxRule.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findTaxRuleById(organizationId: string, id: string, db: AccountingDbClient = prisma) {
    return db.taxRule.findFirst({
      where: {
        organizationId,
        id,
      },
    });
  },

  async upsertTaxRule(
    organizationId: string,
    data: Omit<Prisma.TaxRuleUncheckedCreateInput, "organizationId">,
    db: AccountingDbClient,
  ) {
    if (data.id) {
      return db.taxRule.update({
        where: { id: data.id },
        data,
      });
    }

    return db.taxRule.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async listCostCenters(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.CostCenterWhereInput = {
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
      prisma.costCenter.findMany({
        where,
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.costCenter.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findCostCenterById(organizationId: string, id: string, db: AccountingDbClient = prisma) {
    return db.costCenter.findFirst({
      where: {
        organizationId,
        id,
      },
    });
  },

  async findCostCenterByCode(organizationId: string, code: string, db: AccountingDbClient = prisma) {
    return db.costCenter.findFirst({
      where: {
        organizationId,
        code,
      },
      select: {
        id: true,
      },
    });
  },

  async countCostCenterUsages(organizationId: string, id: string) {
    const costCenter = await prisma.costCenter.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            voucherLines: true,
            journalLines: true,
          },
        },
      },
    });

    if (!costCenter) {
      return 0;
    }

    return costCenter._count.voucherLines + costCenter._count.journalLines;
  },

  async upsertCostCenter(
    organizationId: string,
    data: Omit<Prisma.CostCenterUncheckedCreateInput, "organizationId">,
    db: AccountingDbClient,
  ) {
    if (data.id) {
      return db.costCenter.update({
        where: { id: data.id },
        data,
      });
    }

    return db.costCenter.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveCostCenter(id: string, db: AccountingDbClient) {
    return db.costCenter.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async listCatalogItems(input: { organizationId: string; filters: CatalogFilters }) {
    const q = normalizeQuery(input.filters.q);
    const where: Prisma.CatalogItemWhereInput = {
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
      prisma.catalogItem.findMany({
        where,
        include: {
          defaultLedgerAccount: {
            select: {
              code: true,
              name: true,
            },
          },
          defaultTax: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: [{ deletedAt: "asc" }, { code: "asc" }],
        skip: getSkip(input.filters.page),
        take: PAGE_SIZE,
      }),
      prisma.catalogItem.count({ where }),
    ]);

    return { rows, totalItems };
  },

  async findCatalogItemById(organizationId: string, id: string, db: AccountingDbClient = prisma) {
    return db.catalogItem.findFirst({
      where: {
        organizationId,
        id,
      },
    });
  },

  async findCatalogItemByCode(organizationId: string, code: string, db: AccountingDbClient = prisma) {
    return db.catalogItem.findFirst({
      where: {
        organizationId,
        code,
      },
      select: {
        id: true,
      },
    });
  },

  async countCatalogItemUsages(organizationId: string, id: string) {
    const item = await prisma.catalogItem.findFirst({
      where: { organizationId, id },
      select: {
        _count: {
          select: {
            salesInvoiceLines: true,
            purchaseBillLines: true,
            expenseLines: true,
          },
        },
      },
    });

    if (!item) {
      return 0;
    }

    return (
      item._count.salesInvoiceLines +
      item._count.purchaseBillLines +
      item._count.expenseLines
    );
  },

  async upsertCatalogItem(
    organizationId: string,
    data: Omit<Prisma.CatalogItemUncheckedCreateInput, "organizationId">,
    db: AccountingDbClient,
  ) {
    if (data.id) {
      return db.catalogItem.update({
        where: { id: data.id },
        data,
      });
    }

    return db.catalogItem.create({
      data: {
        ...data,
        organizationId,
      },
    });
  },

  async archiveCatalogItem(id: string, db: AccountingDbClient) {
    return db.catalogItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },

  async listDependencies(organizationId: string) {
    const [taxes, ledgerAccounts] = await prisma.$transaction([
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
    ]);

    return {
      taxes,
      ledgerAccounts,
    };
  },
};
