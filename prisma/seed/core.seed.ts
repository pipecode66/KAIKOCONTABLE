import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const systemRoles = [
  { key: "super_admin", name: "Super Admin", isSystem: true },
  { key: "admin", name: "Administrador", isSystem: true },
  { key: "accountant", name: "Contador", isSystem: true },
  { key: "assistant", name: "Asistente", isSystem: true },
  { key: "viewer", name: "Visualizador", isSystem: true },
];

const permissions = [
  ["organizations", "read", "organizations.read"],
  ["organizations", "manage", "organizations.manage"],
  ["admin", "manage", "admin.manage"],
  ["catalogs", "manage", "catalogs.manage"],
  ["sales", "manage", "sales.manage"],
  ["purchases", "manage", "purchases.manage"],
  ["treasury", "manage", "treasury.manage"],
  ["accounting", "manage", "accounting.manage"],
  ["accounting", "manual_journal", "accounting.manual_journal.post"],
  ["accounting", "opening_balance", "accounting.opening_balance.post"],
  ["accounting", "close_period", "accounting.period.close"],
  ["accounting", "reopen_period", "accounting.period.reopen"],
  ["accounting", "lock_period", "accounting.period.lock"],
  ["reports", "read", "reports.read"],
  ["audit", "read", "audit.read"],
] as const;

const rolePermissionMatrix: Record<string, string[]> = {
  super_admin: permissions.map((permission) => permission[2]),
  admin: permissions.map((permission) => permission[2]),
  accountant: [
    "catalogs.manage",
    "sales.manage",
    "purchases.manage",
    "treasury.manage",
    "accounting.manage",
    "accounting.manual_journal.post",
    "accounting.opening_balance.post",
    "reports.read",
    "audit.read",
  ],
  assistant: ["catalogs.manage", "sales.manage", "purchases.manage", "treasury.manage", "reports.read"],
  viewer: ["organizations.read", "reports.read", "audit.read"],
};

export async function runCoreSeed() {
  const cop = await prisma.currency.upsert({
    where: { code: "COP" },
    update: {
      name: "Peso colombiano",
      symbol: "$",
    },
    create: {
      code: "COP",
      name: "Peso colombiano",
      symbol: "$",
      decimals: 2,
    },
  });

  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { id: `sys-role-${role.key}` },
      update: role,
      create: {
        id: `sys-role-${role.key}`,
        ...role,
      },
    });
  }

  for (const [module, action, code] of permissions) {
    await prisma.permission.upsert({
      where: { id: `sys-permission-${code.replaceAll(".", "-")}` },
      update: {
        module,
        action,
        code,
      },
      create: {
        id: `sys-permission-${code.replaceAll(".", "-")}`,
        module,
        action,
        code,
      },
    });
  }

  const roles = await prisma.role.findMany({
    where: { isSystem: true },
    include: {
      rolePermissions: true,
    },
  });

  const permissionsByCode = await prisma.permission.findMany({
    where: { organizationId: null },
  });

  for (const role of roles) {
    const codes = rolePermissionMatrix[role.key] ?? [];
    for (const code of codes) {
      const permission = permissionsByCode.find((item) => item.code === code);
      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const passwordHash = await hash("KaikoDemo2026!");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kaiko.local" },
    update: {
      name: "Admin KAIKO",
      isActive: true,
    },
    create: {
      name: "Admin KAIKO",
      email: "admin@kaiko.local",
      credential: {
        create: {
          passwordHash,
        },
      },
    },
  });

  await prisma.userCredential.upsert({
    where: { userId: adminUser.id },
    update: { passwordHash },
    create: {
      userId: adminUser.id,
      passwordHash,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "kaiko-demo" },
    update: {
      name: "KAIKO Demo",
      baseCurrencyId: cop.id,
    },
    create: {
      name: "KAIKO Demo",
      slug: "kaiko-demo",
      legalName: "KAIKO Demo SAS",
      taxId: "900123456-7",
      baseCurrencyId: cop.id,
      createdById: adminUser.id,
      settings: {
        create: {
          timezone: "America/Bogota",
          locale: "es-CO",
          fiscalYearStartMonth: 1,
          numberFormat: "es-CO-currency",
          dateFormat: "dd/MM/yyyy",
        },
      },
    },
    include: {
      settings: true,
    },
  });

  const adminRole = roles.find((role) => role.key === "admin");

  if (adminRole) {
    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: adminUser.id,
        },
      },
      update: {
        roleId: adminRole.id,
      },
      create: {
        organizationId: organization.id,
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  const baseAccounts = [
    ["1105", "Caja general", "ASSET", "DEBIT"],
    ["1110", "Bancos", "ASSET", "DEBIT"],
    ["1305", "Clientes nacionales", "ASSET", "DEBIT"],
    ["2205", "Proveedores nacionales", "LIABILITY", "CREDIT"],
    ["2408", "IVA por pagar", "LIABILITY", "CREDIT"],
    ["2365", "Retención en la fuente", "LIABILITY", "CREDIT"],
    ["4135", "Ingresos por servicios", "REVENUE", "CREDIT"],
    ["5135", "Gastos operacionales", "EXPENSE", "DEBIT"],
    ["3105", "Capital social", "EQUITY", "CREDIT"],
    ["5905", "Ganancias y pérdidas", "EQUITY", "CREDIT"],
  ] as const;

  for (const [code, name, type, normalBalance] of baseAccounts) {
    await prisma.ledgerAccount.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code,
        },
      },
      update: {
        name,
      },
      create: {
        organizationId: organization.id,
        code,
        name,
        type,
        normalBalance,
      },
    });
  }

  const taxes = [
    {
      code: "IVA19",
      name: "IVA 19%",
      kind: "VAT",
      treatment: "TAXABLE",
      rate: "19.0000",
      isWithholding: false,
    },
    {
      code: "IVA05",
      name: "IVA 5%",
      kind: "VAT",
      treatment: "TAXABLE",
      rate: "5.0000",
      isWithholding: false,
    },
    {
      code: "RETFTE25",
      name: "Retefuente 2.5%",
      kind: "WITHHOLDING_INCOME",
      treatment: "TAXABLE",
      rate: "2.5000",
      isWithholding: true,
    },
    {
      code: "RETICA966",
      name: "Retención ICA 9.66 x 1000",
      kind: "WITHHOLDING_ICA",
      treatment: "TAXABLE",
      rate: "0.9660",
      isWithholding: true,
    },
  ] as const;

  for (const tax of taxes) {
    await prisma.tax.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: tax.code,
        },
      },
      update: {
        name: tax.name,
        rate: tax.rate,
      },
      create: {
        organizationId: organization.id,
        ...tax,
      },
    });
  }

  const iva19 = await prisma.tax.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "IVA19",
    },
  });

  await prisma.taxRule.upsert({
    where: {
      id: `${organization.id}-iva19-general`,
    },
    update: {
      name: "IVA general servicios",
    },
    create: {
      id: `${organization.id}-iva19-general`,
      organizationId: organization.id,
      taxId: iva19.id,
      name: "IVA general servicios",
      effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
      priority: 100,
      documentType: "SALES_INVOICE",
      operationType: "SERVICE",
    },
  });

  const sequences = [
    ["SALES", "sales_invoice", "FV", new Date().getFullYear()],
    ["PURCHASES", "purchase_bill", "FC", new Date().getFullYear()],
    ["TREASURY", "payment", "RC", new Date().getFullYear()],
    ["TREASURY", "transfer", "TR", new Date().getFullYear()],
    ["ACCOUNTING", "journal_entry", "JE", new Date().getFullYear()],
  ] as const;

  for (const [module, documentType, prefix, fiscalYear] of sequences) {
    await prisma.documentSequence.upsert({
      where: {
        organizationId_documentType_prefix_fiscalYear: {
          organizationId: organization.id,
          documentType,
          prefix,
          fiscalYear,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        module,
        documentType,
        prefix,
        fiscalYear,
      },
    });
  }

  for (let month = 1; month <= 12; month += 1) {
    const start = new Date(Date.UTC(new Date().getFullYear(), month - 1, 1));
    const end = new Date(Date.UTC(new Date().getFullYear(), month, 0));

    await prisma.accountingPeriod.upsert({
      where: {
        organizationId_fiscalYear_periodNumber: {
          organizationId: organization.id,
          fiscalYear: start.getUTCFullYear(),
          periodNumber: month,
        },
      },
      update: {
        periodStart: start,
        periodEnd: end,
      },
      create: {
        organizationId: organization.id,
        fiscalYear: start.getUTCFullYear(),
        periodNumber: month,
        periodStart: start,
        periodEnd: end,
      },
    });
  }
}
