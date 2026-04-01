import {
  Prisma,
  PrismaClient,
  type AccountingPeriodStatus,
  type JournalEntryType,
  type JournalSourceType,
  type VoucherType,
} from "@prisma/client";

import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";
import { formatSequenceNumber } from "@/modules/accounting/domain/services/sequence.service";
import type { OperationalPostingAccounts } from "@/modules/accounting/domain/services/operational-posting.service";

type AccountingDbClient = Prisma.TransactionClient | PrismaClient;

const voucherListSelect = {
  id: true,
  voucherNumber: true,
  voucherType: true,
  description: true,
  entryDate: true,
  status: true,
  debitTotal: true,
  creditTotal: true,
  postedAt: true,
  voidedAt: true,
  voidReason: true,
  version: true,
  accountingPeriod: {
    select: {
      fiscalYear: true,
      periodNumber: true,
    },
  },
  lines: {
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      description: true,
      debit: true,
      credit: true,
      ledgerAccount: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  },
  documentLinks: {
    where: {
      journalEntryId: {
        not: null,
      },
    },
    select: {
      journalEntryId: true,
      journalEntry: {
        select: {
          entryNumber: true,
        },
      },
    },
  },
} satisfies Prisma.AccountingVoucherSelect;

const journalEntryListSelect = {
  id: true,
  entryNumber: true,
  entryDate: true,
  description: true,
  sourceType: true,
  sourceId: true,
  entryType: true,
  totalDebit: true,
  totalCredit: true,
  postedAt: true,
  reversalOfId: true,
  reversalReason: true,
  reversedBy: {
    select: {
      id: true,
    },
  },
  documentLinks: {
    where: {
      accountingVoucherId: {
        not: null,
      },
    },
    select: {
      accountingVoucherId: true,
      accountingVoucher: {
        select: {
          voucherNumber: true,
        },
      },
    },
  },
  lines: {
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      description: true,
      debit: true,
      credit: true,
      ledgerAccount: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.JournalEntrySelect;

export const accountingCoreRepository = {
  async getOrganizationContext(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        baseCurrency: true,
      },
    });

    if (!organization || !organization.settings) {
      throw new NotFoundError("No encontramos la configuracion contable de la organizacion.");
    }

    return organization;
  },

  async listPeriods(organizationId: string) {
    return prisma.accountingPeriod.findMany({
      where: { organizationId },
      include: {
        closedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        lockedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        reopenedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            journalEntries: true,
            accountingVouchers: true,
          },
        },
      },
      orderBy: [{ fiscalYear: "desc" }, { periodNumber: "desc" }],
    });
  },

  async findPeriodById(input: { organizationId: string; periodId: string }, db: AccountingDbClient = prisma) {
    return db.accountingPeriod.findFirst({
      where: {
        id: input.periodId,
        organizationId: input.organizationId,
      },
      include: {
        _count: {
          select: {
            journalEntries: true,
            accountingVouchers: true,
          },
        },
      },
    });
  },

  async resolvePeriodByDate(input: { organizationId: string; date: Date }, db: AccountingDbClient = prisma) {
    const dayStart = new Date(input.date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(input.date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    return db.accountingPeriod.findFirst({
      where: {
        organizationId: input.organizationId,
        periodStart: { lte: dayEnd },
        periodEnd: { gte: dayStart },
      },
      orderBy: [{ periodStart: "asc" }],
    });
  },

  async updatePeriodStatus(
    input: {
      periodId: string;
      status: AccountingPeriodStatus;
      actorUserId: string;
      at: Date;
    },
    db: AccountingDbClient,
  ) {
    const statusData =
      input.status === "CLOSED"
        ? { closedAt: input.at, closedById: input.actorUserId }
        : input.status === "LOCKED"
          ? { lockedAt: input.at, lockedById: input.actorUserId }
          : { reopenedAt: input.at, reopenedById: input.actorUserId };

    return db.accountingPeriod.update({
      where: {
        id: input.periodId,
      },
      data: {
        status: input.status,
        ...statusData,
      },
    });
  },

  async listVoucherFormDependencies(organizationId: string) {
    const [accounts, thirdParties, costCenters, periods] = await prisma.$transaction([
      prisma.ledgerAccount.findMany({
        where: {
          organizationId,
          deletedAt: null,
          isPosting: true,
          allowManualEntries: true,
        },
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
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
      prisma.costCenter.findMany({
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
      prisma.accountingPeriod.findMany({
        where: {
          organizationId,
          status: "OPEN",
        },
        orderBy: [{ fiscalYear: "desc" }, { periodNumber: "desc" }],
        select: {
          id: true,
          fiscalYear: true,
          periodNumber: true,
        },
      }),
    ]);

    return {
      accounts,
      thirdParties,
      costCenters,
      openPeriods: periods.map((period) => ({
        id: period.id,
        label: `P${String(period.periodNumber).padStart(2, "0")} / ${period.fiscalYear}`,
      })),
    };
  },

  async listVouchers(organizationId: string) {
    return prisma.accountingVoucher.findMany({
      where: { organizationId },
      select: voucherListSelect,
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    });
  },

  async findVoucherById(
    input: { organizationId: string; voucherId: string },
    db: AccountingDbClient = prisma,
  ) {
    return db.accountingVoucher.findFirst({
      where: {
        id: input.voucherId,
        organizationId: input.organizationId,
      },
      include: {
        accountingPeriod: true,
        lines: true,
        documentLinks: {
          include: {
            journalEntry: true,
          },
        },
      },
    });
  },

  async saveVoucherDraft(
    input: {
      organizationId: string;
      currencyId: string;
      accountingPeriodId: string;
      voucherType: VoucherType;
      description: string;
      entryDate: Date;
      debitTotal: Prisma.Decimal;
      creditTotal: Prisma.Decimal;
      lines: Array<{
        ledgerAccountId: string;
        thirdPartyId?: string | null;
        costCenterId?: string | null;
        description?: string | null;
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
      }>;
      voucherId?: string;
      expectedVersion?: number;
    },
    db: AccountingDbClient,
  ) {
    if (!input.voucherId) {
      return db.accountingVoucher.create({
        data: {
          organizationId: input.organizationId,
          accountingPeriodId: input.accountingPeriodId,
          currencyId: input.currencyId,
          voucherType: input.voucherType,
          description: input.description,
          entryDate: input.entryDate,
          debitTotal: input.debitTotal,
          creditTotal: input.creditTotal,
          lines: {
            create: input.lines,
          },
        },
      });
    }

    const current = await db.accountingVoucher.findUnique({
      where: {
        id: input.voucherId,
      },
      select: {
        id: true,
        version: true,
      },
    });

    if (!current) {
      throw new NotFoundError("No encontramos el voucher solicitado.");
    }

    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new NotFoundError("El voucher cambio mientras lo editabas.");
    }

    return db.accountingVoucher.update({
      where: {
        id: input.voucherId,
      },
      data: {
        accountingPeriodId: input.accountingPeriodId,
        voucherType: input.voucherType,
        description: input.description,
        entryDate: input.entryDate,
        debitTotal: input.debitTotal,
        creditTotal: input.creditTotal,
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

  async updateVoucherAfterPost(
    input: {
      voucherId: string;
      organizationId: string;
      voucherNumber: string;
      postedAt: Date;
    },
    db: AccountingDbClient,
  ) {
    return db.accountingVoucher.update({
      where: { id: input.voucherId },
      data: {
        voucherNumber: input.voucherNumber,
        status: "POSTED",
        postedAt: input.postedAt,
        version: {
          increment: 1,
        },
      },
    });
  },

  async markVoucherVoided(
    input: {
      voucherId: string;
      voidedAt: Date;
      voidReason: string;
    },
    db: AccountingDbClient,
  ) {
    return db.accountingVoucher.update({
      where: { id: input.voucherId },
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

  async listJournalEntries(organizationId: string) {
    return prisma.journalEntry.findMany({
      where: { organizationId },
      select: journalEntryListSelect,
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    });
  },

  async findJournalEntryById(
    input: { organizationId: string; journalEntryId: string },
    db: AccountingDbClient = prisma,
  ) {
    return db.journalEntry.findFirst({
      where: {
        id: input.journalEntryId,
        organizationId: input.organizationId,
      },
      include: {
        lines: true,
        reversedBy: {
          select: {
            id: true,
          },
        },
        documentLinks: true,
      },
    });
  },

  async findJournalEntryBySource(
    input: {
      organizationId: string;
      sourceType: JournalSourceType;
      sourceId: string;
    },
    db: AccountingDbClient = prisma,
  ) {
    return db.journalEntry.findUnique({
      where: {
        organizationId_sourceType_sourceId: {
          organizationId: input.organizationId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      },
      include: {
        lines: true,
        reversedBy: {
          select: {
            id: true,
          },
        },
      },
    });
  },

  async resolveOperationalPostingAccounts(
    organizationId: string,
    db: AccountingDbClient = prisma,
  ): Promise<OperationalPostingAccounts> {
    const requiredCodes = ["1305", "2205", "2408", "2365", "1355", "1365", "1110", "1105"] as const;
    const accounts = await db.ledgerAccount.findMany({
      where: {
        organizationId,
        code: {
          in: [...requiredCodes],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
      },
    });

    const accountsByCode = new Map(accounts.map((account) => [account.code, account.id]));

    const resolve = (code: (typeof requiredCodes)[number], label: string) => {
      const accountId = accountsByCode.get(code);
      if (!accountId) {
        throw new NotFoundError(
          `Falta la cuenta base ${code} (${label}) para publicar documentos operativos.`,
        );
      }

      return accountId;
    };

    return {
      accountsReceivableId: resolve("1305", "Clientes nacionales"),
      accountsPayableId: resolve("2205", "Proveedores nacionales"),
      outputTaxId: resolve("2408", "IVA por pagar"),
      inputTaxId: resolve("1355", "IVA descontable"),
      withholdingPayableId: resolve("2365", "Retencion en la fuente"),
      withholdingReceivableId: resolve("1365", "Retenciones por cobrar"),
      bankId: resolve("1110", "Bancos"),
      cashId: resolve("1105", "Caja general"),
    };
  },

  async createJournalEntry(
    input: {
      organizationId: string;
      accountingPeriodId?: string | null;
      currencyId: string;
      entryNumber: string;
      entryDate: Date;
      sourceType: JournalSourceType;
      sourceId: string;
      entryType: JournalEntryType;
      description: string;
      totalDebit: Prisma.Decimal;
      totalCredit: Prisma.Decimal;
      reversalOfId?: string | null;
      reversalReason?: string | null;
      postedAt: Date;
      lines: Array<{
        ledgerAccountId: string;
        thirdPartyId?: string | null;
        costCenterId?: string | null;
        description?: string | null;
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
      }>;
    },
    db: AccountingDbClient,
  ) {
    return db.journalEntry.create({
      data: {
        organizationId: input.organizationId,
        accountingPeriodId: input.accountingPeriodId ?? null,
        currencyId: input.currencyId,
        entryNumber: input.entryNumber,
        entryDate: input.entryDate,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        entryType: input.entryType,
        description: input.description,
        totalDebit: input.totalDebit,
        totalCredit: input.totalCredit,
        reversalOfId: input.reversalOfId ?? null,
        reversalReason: input.reversalReason ?? null,
        postedAt: input.postedAt,
        lines: {
          create: input.lines,
        },
      },
    });
  },

  async createDocumentLink(
    input: {
      organizationId: string;
      sourceModule: string;
      sourceType: JournalSourceType;
      sourceId: string;
      accountingVoucherId?: string | null;
      journalEntryId?: string | null;
    },
    db: AccountingDbClient,
  ) {
    return db.documentLink.create({
      data: {
        organizationId: input.organizationId,
        sourceModule: input.sourceModule,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        accountingVoucherId: input.accountingVoucherId ?? null,
        journalEntryId: input.journalEntryId ?? null,
      },
    });
  },

  async reserveSequenceNumber(
    input: {
      organizationId: string;
      documentType: string;
      fiscalYear: number;
    },
    db: AccountingDbClient,
  ) {
    const rows = await db.$queryRaw<Array<{
      id: string;
      prefix: string;
      padding: number;
      currentNumber: number;
    }>>(Prisma.sql`
      SELECT id, prefix, padding, "currentNumber"
      FROM document_sequences
      WHERE "organizationId" = ${input.organizationId}
        AND "documentType" = ${input.documentType}
        AND "fiscalYear" = ${input.fiscalYear}
      ORDER BY "createdAt" ASC
      FOR UPDATE
    `);

    const sequence = rows[0];

    if (!sequence) {
      throw new NotFoundError(`No existe una secuencia configurada para ${input.documentType}.`);
    }

    const nextNumber = sequence.currentNumber + 1;

    await db.documentSequence.update({
      where: {
        id: sequence.id,
      },
      data: {
        currentNumber: nextNumber,
        version: {
          increment: 1,
        },
      },
    });

    return formatSequenceNumber({
      prefix: sequence.prefix,
      currentNumber: nextNumber,
      padding: sequence.padding,
    });
  },

  async countCoreMetrics(organizationId: string) {
    const [openPeriods, draftVouchers, postedVouchers, postedEntries] = await prisma.$transaction([
      prisma.accountingPeriod.count({
        where: {
          organizationId,
          status: "OPEN",
        },
      }),
      prisma.accountingVoucher.count({
        where: {
          organizationId,
          status: "DRAFT",
        },
      }),
      prisma.accountingVoucher.count({
        where: {
          organizationId,
          status: "POSTED",
        },
      }),
      prisma.journalEntry.count({
        where: {
          organizationId,
          postedAt: {
            not: null,
          },
        },
      }),
    ]);

    return {
      openPeriods,
      draftVouchers,
      postedVouchers,
      postedEntries,
    };
  },
};
