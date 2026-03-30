import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function runDemoSeed() {
  const organization = await prisma.organization.findUnique({
    where: { slug: "kaiko-demo" },
  });

  if (!organization) {
    return;
  }

  const salesAccount = await prisma.ledgerAccount.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "4135",
    },
  });

  const expenseAccount = await prisma.ledgerAccount.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "5135",
    },
  });

  const iva19 = await prisma.tax.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "IVA19",
    },
  });

  const customer = await prisma.thirdParty.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: "CLI-001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: "CLI-001",
      name: "Tecnología Atlas SAS",
      legalName: "Tecnología Atlas SAS",
      taxId: "901456789-3",
      email: "pagos@atlas.co",
      type: "CUSTOMER",
      taxClassification: "RESPONSABLE_IVA",
      vatResponsibility: "RESPONSABLE",
      municipalityCode: "11001",
      economicActivityCode: "6201",
    },
  });

  const supplier = await prisma.thirdParty.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: "PRO-001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: "PRO-001",
      name: "Servicios Cloud Andina",
      legalName: "Servicios Cloud Andina SAS",
      taxId: "900654321-9",
      email: "facturacion@cloudandina.co",
      type: "SUPPLIER",
      taxClassification: "RESPONSABLE_IVA",
      vatResponsibility: "RESPONSABLE",
      municipalityCode: "11001",
      economicActivityCode: "6202",
    },
  });

  const paymentMethod = await prisma.paymentMethod.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: "TRANSFER",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: "TRANSFER",
      name: "Transferencia bancaria",
    },
  });

  const bankAccount = await prisma.bankAccount.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: "BANCO-001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: "BANCO-001",
      name: "Cuenta principal",
      bankName: "Bancolombia",
      accountNumber: "000123456789",
      accountType: "checking",
    },
  });

  const salesInvoice = await prisma.salesInvoice.upsert({
    where: {
      organizationId_internalNumber: {
        organizationId: organization.id,
        internalNumber: "SI-DEMO-0001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      customerId: customer.id,
      currencyId: organization.baseCurrencyId,
      internalNumber: "SI-DEMO-0001",
      issueDate: new Date("2026-03-15T00:00:00.000Z"),
      dueDate: new Date("2026-04-15T00:00:00.000Z"),
      status: "POSTED",
      subtotal: "12000000.00",
      taxTotal: "2280000.00",
      withholdingTotal: "0.00",
      total: "14280000.00",
      balanceDue: "4280000.00",
      postedAt: new Date("2026-03-15T10:00:00.000Z"),
      lines: {
        create: [
          {
            description: "Servicio mensual de automatización contable",
            accountId: salesAccount.id,
            taxId: iva19.id,
            quantity: "1.0000",
            unitPrice: "12000000.00",
            lineSubtotal: "12000000.00",
            taxableBase: "12000000.00",
            taxAmount: "2280000.00",
            lineTotal: "14280000.00",
          },
        ],
      },
    },
  });

  await prisma.expense.upsert({
    where: {
      organizationId_internalNumber: {
        organizationId: organization.id,
        internalNumber: "EX-DEMO-0001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      thirdPartyId: supplier.id,
      currencyId: organization.baseCurrencyId,
      internalNumber: "EX-DEMO-0001",
      expenseDate: new Date("2026-03-18T00:00:00.000Z"),
      status: "POSTED",
      subtotal: "2400000.00",
      taxTotal: "456000.00",
      withholdingTotal: "0.00",
      total: "2856000.00",
      balanceDue: "0.00",
      postedAt: new Date("2026-03-18T10:00:00.000Z"),
      lines: {
        create: [
          {
            description: "Infraestructura cloud mensual",
            accountId: expenseAccount.id,
            taxId: iva19.id,
            quantity: "1.0000",
            unitPrice: "2400000.00",
            lineSubtotal: "2400000.00",
            taxableBase: "2400000.00",
            taxAmount: "456000.00",
            lineTotal: "2856000.00",
          },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: {
      id: `${organization.id}-payment-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-payment-demo-1`,
      organizationId: organization.id,
      thirdPartyId: customer.id,
      methodId: paymentMethod.id,
      bankAccountId: bankAccount.id,
      currencyId: organization.baseCurrencyId,
      direction: "RECEIVED",
      paymentDate: new Date("2026-03-20T00:00:00.000Z"),
      status: "POSTED",
      amount: "10000000.00",
      postedAt: new Date("2026-03-20T11:00:00.000Z"),
      allocations: {
        create: [
          {
            salesInvoiceId: salesInvoice.id,
            amount: "10000000.00",
          },
        ],
      },
    },
  });
}
