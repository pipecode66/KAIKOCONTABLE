import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import type {
  LedgerAccountCatalogDto,
  LedgerAccountFormInput,
  LedgerAccountListItemDto,
  LedgerAccountParentOptionDto,
  ResolvedLedgerAccountFilters,
  LedgerAccountSummaryDto,
} from "@/modules/accounting/dto/ledger-account.dto";

type LedgerAccountDbClient = Prisma.TransactionClient | PrismaClient;

const ledgerAccountListSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  type: true,
  normalBalance: true,
  parentId: true,
  isPosting: true,
  allowManualEntries: true,
  updatedAt: true,
  deletedAt: true,
  parent: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.LedgerAccountSelect;

type LedgerAccountListRecord = Prisma.LedgerAccountGetPayload<{
  select: typeof ledgerAccountListSelect;
}>;

function mapLedgerAccountRow(
  account: LedgerAccountListRecord,
  hasChildren: boolean,
): LedgerAccountListItemDto {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    description: account.description,
    type: account.type,
    normalBalance: account.normalBalance,
    parentId: account.parentId,
    parentCode: account.parent?.code ?? null,
    parentName: account.parent?.name ?? null,
    isPosting: account.isPosting,
    allowManualEntries: account.allowManualEntries,
    hasChildren,
    status: account.deletedAt ? "ARCHIVED" : "ACTIVE",
    updatedAt: account.updatedAt.toISOString(),
  };
}

function buildListWhere(input: {
  organizationId: string;
  filters: ResolvedLedgerAccountFilters;
}): Prisma.LedgerAccountWhereInput {
  const { organizationId, filters } = input;

  return {
    organizationId,
    deletedAt:
      filters.status === "ALL" ? undefined : filters.status === "ARCHIVED" ? { not: null } : null,
    type: filters.type === "ALL" ? undefined : filters.type,
    OR: filters.q
      ? [
          {
            code: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
        ]
      : undefined,
  };
}

export const ledgerAccountRepository = {
  async listCatalog(input: {
    organizationId: string;
    filters: ResolvedLedgerAccountFilters;
  }): Promise<LedgerAccountCatalogDto> {
    const where = buildListWhere(input);

    const [rows, totalActive, totalArchived, totalPosting, totalManual] = await prisma.$transaction([
      prisma.ledgerAccount.findMany({
        where,
        select: ledgerAccountListSelect,
        orderBy: [{ code: "asc" }],
      }),
      prisma.ledgerAccount.count({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
        },
      }),
      prisma.ledgerAccount.count({
        where: {
          organizationId: input.organizationId,
          deletedAt: {
            not: null,
          },
        },
      }),
      prisma.ledgerAccount.count({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
          isPosting: true,
        },
      }),
      prisma.ledgerAccount.count({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
          isPosting: true,
          allowManualEntries: true,
        },
      }),
    ]);

    const childCounts = await prisma.ledgerAccount.groupBy({
      by: ["parentId"],
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        parentId: {
          in: rows.map((row) => row.id),
        },
      },
      _count: {
        _all: true,
      },
    });

    const childCountMap = new Map(
      childCounts.map((item) => [item.parentId, item._count._all]),
    );

    const summary: LedgerAccountSummaryDto = {
      totalActive,
      totalArchived,
      totalPosting,
      totalManual,
    };

    return {
      filters: input.filters,
      summary,
      rows: rows.map((row) => mapLedgerAccountRow(row, (childCountMap.get(row.id) ?? 0) > 0)),
    };
  },

  async listParentOptions(input: {
    organizationId: string;
    excludeId?: string;
  }): Promise<LedgerAccountParentOptionDto[]> {
    const rows = await prisma.ledgerAccount.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        id: input.excludeId ? { not: input.excludeId } : undefined,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
      orderBy: [{ code: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
    }));
  },

  async findById(input: { organizationId: string; accountId: string }) {
    return prisma.ledgerAccount.findFirst({
      where: {
        id: input.accountId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        parentId: true,
        code: true,
        name: true,
        description: true,
        type: true,
        normalBalance: true,
        isPosting: true,
        allowManualEntries: true,
        deletedAt: true,
        updatedAt: true,
      },
    });
  },

  async findByCode(input: { organizationId: string; code: string }) {
    return prisma.ledgerAccount.findFirst({
      where: {
        organizationId: input.organizationId,
        code: input.code,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });
  },

  async findParent(input: { organizationId: string; parentId: string }) {
    return prisma.ledgerAccount.findFirst({
      where: {
        id: input.parentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        parentId: true,
        code: true,
        name: true,
        type: true,
      },
    });
  },

  async countActiveChildren(input: { organizationId: string; accountId: string }) {
    return prisma.ledgerAccount.count({
      where: {
        organizationId: input.organizationId,
        parentId: input.accountId,
        deletedAt: null,
      },
    });
  },

  async countUsages(input: { organizationId: string; accountId: string }) {
    const account = await prisma.ledgerAccount.findFirst({
      where: {
        id: input.accountId,
        organizationId: input.organizationId,
      },
      select: {
        _count: {
          select: {
            voucherLines: true,
            journalLines: true,
            postingRulesDebit: true,
            postingRulesCredit: true,
            catalogItems: true,
            salesInvoiceLines: true,
            purchaseBillLines: true,
            expenseLines: true,
          },
        },
      },
    });

    if (!account) {
      return 0;
    }

    return (
      account._count.voucherLines +
      account._count.journalLines +
      account._count.postingRulesDebit +
      account._count.postingRulesCredit +
      account._count.catalogItems +
      account._count.salesInvoiceLines +
      account._count.purchaseBillLines +
      account._count.expenseLines
    );
  },

  async wouldCreateCycle(input: {
    organizationId: string;
    accountId: string;
    nextParentId: string;
  }) {
    let currentParentId: string | null | undefined = input.nextParentId;

    while (currentParentId) {
      if (currentParentId === input.accountId) {
        return true;
      }

      const current: { parentId: string | null } | null = await prisma.ledgerAccount.findFirst({
        where: {
          id: currentParentId,
          organizationId: input.organizationId,
        },
        select: {
          parentId: true,
        },
      });

      currentParentId = current?.parentId;
    }

    return false;
  },

  async create(input: {
    data: LedgerAccountFormInput;
    organizationId: string;
    db: LedgerAccountDbClient;
  }) {
    return input.db.ledgerAccount.create({
      data: {
        organizationId: input.organizationId,
        code: input.data.code,
        name: input.data.name,
        description: input.data.description,
        type: input.data.type,
        normalBalance: input.data.normalBalance,
        parentId: input.data.parentId,
        isPosting: input.data.isPosting,
        allowManualEntries: input.data.allowManualEntries,
      },
      select: ledgerAccountListSelect,
    });
  },

  async update(input: {
    accountId: string;
    data: LedgerAccountFormInput;
    db: LedgerAccountDbClient;
  }) {
    return input.db.ledgerAccount.update({
      where: {
        id: input.accountId,
      },
      data: {
        code: input.data.code,
        name: input.data.name,
        description: input.data.description,
        type: input.data.type,
        normalBalance: input.data.normalBalance,
        parentId: input.data.parentId,
        isPosting: input.data.isPosting,
        allowManualEntries: input.data.allowManualEntries,
      },
      select: ledgerAccountListSelect,
    });
  },

  async archive(input: {
    accountId: string;
    db: LedgerAccountDbClient;
  }) {
    return input.db.ledgerAccount.update({
      where: {
        id: input.accountId,
      },
      data: {
        deletedAt: new Date(),
        allowManualEntries: false,
      },
      select: ledgerAccountListSelect,
    });
  },
};
