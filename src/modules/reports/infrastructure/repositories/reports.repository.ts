import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";

import { normalizeMoney, sumMoney } from "@/lib/money/money.service";
import { prisma } from "@/lib/prisma/client";

const PAGE_SIZE = 10;

function getAccountSignedBalance(
  normalBalance: "DEBIT" | "CREDIT",
  totals: { debit: Decimal.Value; credit: Decimal.Value },
) {
  const debit = normalizeMoney(totals.debit);
  const credit = normalizeMoney(totals.credit);
  return normalBalance === "DEBIT" ? debit.minus(credit) : credit.minus(debit);
}

function getSkip(page: number) {
  return (page - 1) * PAGE_SIZE;
}

function differenceInDaysFloor(asOf: Date, value: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((asOf.getTime() - value.getTime()) / millisecondsPerDay));
}

function bucketizeAge(days: number) {
  if (days <= 0) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "91+";
}

export const reportsRepository = {
  async listLedgerBalancesAsOf(organizationId: string, asOf: Date) {
    const accounts = await prisma.ledgerAccount.findMany({
      where: {
        organizationId,
        deletedAt: null,
        type: {
          in: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "COST_OF_SALES"],
        },
      },
      orderBy: [{ code: "asc" }],
      include: {
        journalLines: {
          where: {
            journalEntry: {
              organizationId,
              postedAt: {
                not: null,
              },
              entryDate: {
                lte: asOf,
              },
            },
          },
          select: {
            debit: true,
            credit: true,
            journalEntry: {
              select: {
                entryDate: true,
              },
            },
          },
        },
      },
    });

    return accounts.map((account) => {
      const totalDebit = sumMoney(account.journalLines.map((line) => line.debit));
      const totalCredit = sumMoney(account.journalLines.map((line) => line.credit));
      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        balance: getAccountSignedBalance(account.normalBalance, {
          debit: totalDebit,
          credit: totalCredit,
        }),
      };
    });
  },

  async listTrialBalanceSource(organizationId: string, to: Date) {
    return prisma.ledgerAccount.findMany({
      where: {
        organizationId,
        deletedAt: null,
        type: {
          in: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "COST_OF_SALES"],
        },
      },
      orderBy: [{ code: "asc" }],
      include: {
        journalLines: {
          where: {
            journalEntry: {
              organizationId,
              postedAt: {
                not: null,
              },
              entryDate: {
                lte: to,
              },
            },
          },
          select: {
            debit: true,
            credit: true,
            journalEntry: {
              select: {
                entryDate: true,
              },
            },
          },
        },
      },
    });
  },

  async listReceivables(input: {
    organizationId: string;
    asOf: Date;
    q: string;
    page: number;
  }) {
    const where = {
      organizationId: input.organizationId,
      status: "POSTED" as const,
      deletedAt: null,
      balanceDue: {
        gt: new Prisma.Decimal("0.00"),
      },
      OR: input.q
        ? [
            { documentNumber: { contains: input.q, mode: "insensitive" as const } },
            { internalNumber: { contains: input.q, mode: "insensitive" as const } },
            { customer: { name: { contains: input.q, mode: "insensitive" as const } } },
          ]
        : undefined,
    };

    const [totalItems, rows] = await Promise.all([
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { issueDate: "asc" }],
        skip: getSkip(input.page),
        take: PAGE_SIZE,
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      totalItems,
      rows: rows.map((row) => ({
        id: row.id,
        sourceType: "SALES_INVOICE" as const,
        documentNumber: row.documentNumber ?? row.internalNumber,
        thirdPartyName: row.customer.name,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        total: row.total,
        balanceDue: row.balanceDue,
        ageDays: differenceInDaysFloor(input.asOf, row.dueDate ?? row.issueDate),
      })),
    };
  },

  async sumOpenReceivables(organizationId: string) {
    const aggregate = await prisma.salesInvoice.aggregate({
      where: {
        organizationId,
        status: "POSTED",
        deletedAt: null,
        balanceDue: {
          gt: new Prisma.Decimal("0.00"),
        },
      },
      _sum: {
        balanceDue: true,
      },
    });

    return normalizeMoney(aggregate._sum.balanceDue ?? 0);
  },

  async listPayables(input: {
    organizationId: string;
    asOf: Date;
    q: string;
    page: number;
  }) {
    const baseQ = input.q
      ? [
          { documentNumber: { contains: input.q, mode: "insensitive" as const } },
          { internalNumber: { contains: input.q, mode: "insensitive" as const } },
        ]
      : undefined;

    const [bills, expenses] = await Promise.all([
      prisma.purchaseBill.findMany({
        where: {
          organizationId: input.organizationId,
          status: "POSTED",
          deletedAt: null,
          balanceDue: {
            gt: new Prisma.Decimal("0.00"),
          },
          OR: baseQ
            ? [...baseQ, { supplier: { name: { contains: input.q, mode: "insensitive" as const } } }]
            : undefined,
        },
        include: {
          supplier: { select: { name: true } },
        },
      }),
      prisma.expense.findMany({
        where: {
          organizationId: input.organizationId,
          status: "POSTED",
          deletedAt: null,
          balanceDue: {
            gt: new Prisma.Decimal("0.00"),
          },
          OR: baseQ
            ? [...baseQ, { thirdParty: { name: { contains: input.q, mode: "insensitive" as const } } }]
            : undefined,
        },
        include: {
          thirdParty: { select: { name: true } },
        },
      }),
    ]);

    const merged = [
      ...bills.map((row) => ({
        id: row.id,
        sourceType: "PURCHASE_BILL" as const,
        documentNumber: row.documentNumber ?? row.internalNumber,
        thirdPartyName: row.supplier.name,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        total: row.total,
        balanceDue: row.balanceDue,
        ageDays: differenceInDaysFloor(input.asOf, row.dueDate ?? row.issueDate),
      })),
      ...expenses.map((row) => ({
        id: row.id,
        sourceType: "EXPENSE" as const,
        documentNumber: row.documentNumber ?? row.internalNumber,
        thirdPartyName: row.thirdParty?.name ?? "Sin tercero",
        issueDate: row.expenseDate,
        dueDate: null,
        total: row.total,
        balanceDue: row.balanceDue,
        ageDays: differenceInDaysFloor(input.asOf, row.expenseDate),
      })),
    ].sort((left, right) => {
      const leftDate = left.dueDate ?? left.issueDate;
      const rightDate = right.dueDate ?? right.issueDate;
      return leftDate.getTime() - rightDate.getTime();
    });

    return {
      totalItems: merged.length,
      rows: merged.slice(getSkip(input.page), getSkip(input.page) + PAGE_SIZE),
      allRows: merged,
    };
  },

  async sumOpenPayables(organizationId: string) {
    const [purchaseBillAggregate, expenseAggregate] = await Promise.all([
      prisma.purchaseBill.aggregate({
        where: {
          organizationId,
          status: "POSTED",
          deletedAt: null,
          balanceDue: {
            gt: new Prisma.Decimal("0.00"),
          },
        },
        _sum: {
          balanceDue: true,
        },
      }),
      prisma.expense.aggregate({
        where: {
          organizationId,
          status: "POSTED",
          deletedAt: null,
          balanceDue: {
            gt: new Prisma.Decimal("0.00"),
          },
        },
        _sum: {
          balanceDue: true,
        },
      }),
    ]);

    return normalizeMoney(
      new Decimal(purchaseBillAggregate._sum.balanceDue ?? 0).plus(expenseAggregate._sum.balanceDue ?? 0),
    );
  },

  async listCashFlowMovements(organizationId: string, from: Date, to: Date) {
    const [payments, transfers] = await Promise.all([
      prisma.payment.findMany({
        where: {
          organizationId,
          status: "POSTED",
          deletedAt: null,
          paymentDate: {
            gte: from,
            lte: to,
          },
        },
        orderBy: [{ paymentDate: "asc" }],
        include: {
          thirdParty: { select: { name: true } },
        },
      }),
      prisma.transfer.findMany({
        where: {
          organizationId,
          status: "POSTED",
          transferDate: {
            gte: from,
            lte: to,
          },
        },
        orderBy: [{ transferDate: "asc" }],
        include: {
          sourceBankAccount: { select: { name: true } },
          sourceCashAccount: { select: { name: true } },
          destinationBankAccount: { select: { name: true } },
          destinationCashAccount: { select: { name: true } },
        },
      }),
    ]);

    return { payments, transfers };
  },

  async listReportExports(input: { organizationId: string; page: number }) {
    const where = {
      organizationId: input.organizationId,
      type: "reports.export",
    };

    const [totalItems, rows] = await Promise.all([
      prisma.asyncJob.count({ where }),
      prisma.asyncJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: getSkip(input.page),
        take: PAGE_SIZE,
      }),
    ]);

    return {
      totalItems,
      rows,
    };
  },

  async getExportJobById(organizationId: string, jobId: string) {
    return prisma.asyncJob.findFirst({
      where: {
        id: jobId,
        organizationId,
        type: "reports.export",
      },
    });
  },

  bucketizeOutstanding(rows: Array<{ ageDays: number; balanceDue: Prisma.Decimal | Decimal | string }>) {
    const buckets = {
      current: new Decimal(0),
      "1-30": new Decimal(0),
      "31-60": new Decimal(0),
      "61-90": new Decimal(0),
      "91+": new Decimal(0),
    };

    for (const row of rows) {
      const bucket = bucketizeAge(row.ageDays);
      buckets[bucket] = buckets[bucket].plus(normalizeMoney(row.balanceDue));
    }

    return buckets;
  },

  pageSize: PAGE_SIZE,
};
