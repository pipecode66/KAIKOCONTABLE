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

  const accountsPayableAccount = await prisma.ledgerAccount.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "2205",
    },
  });

  const inputTaxAccount = await prisma.ledgerAccount.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "1355",
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

  const purchaseBill = await prisma.purchaseBill.upsert({
    where: {
      organizationId_internalNumber: {
        organizationId: organization.id,
        internalNumber: "PB-DEMO-0001",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      supplierId: supplier.id,
      currencyId: organization.baseCurrencyId,
      internalNumber: "PB-DEMO-0001",
      documentNumber: "FC-000001",
      issueDate: new Date("2026-03-17T00:00:00.000Z"),
      dueDate: new Date("2026-04-17T00:00:00.000Z"),
      status: "POSTED",
      subtotal: "2400000.00",
      taxTotal: "456000.00",
      withholdingTotal: "0.00",
      total: "2856000.00",
      balanceDue: "2856000.00",
      postedAt: new Date("2026-03-17T10:00:00.000Z"),
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

  await prisma.purchaseBill.upsert({
    where: {
      organizationId_internalNumber: {
        organizationId: organization.id,
        internalNumber: "PB-DEMO-0002",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      supplierId: supplier.id,
      currencyId: organization.baseCurrencyId,
      internalNumber: "PB-DEMO-0002",
      issueDate: new Date("2026-03-28T00:00:00.000Z"),
      dueDate: new Date("2026-04-28T00:00:00.000Z"),
      status: "DRAFT",
      subtotal: "1800000.00",
      taxTotal: "342000.00",
      withholdingTotal: "0.00",
      total: "2142000.00",
      balanceDue: "2142000.00",
      lines: {
        create: [
          {
            description: "Suscripcion de plataforma operativa",
            accountId: expenseAccount.id,
            taxId: iva19.id,
            quantity: "1.0000",
            unitPrice: "1800000.00",
            lineSubtotal: "1800000.00",
            taxableBase: "1800000.00",
            taxAmount: "342000.00",
            lineTotal: "2142000.00",
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

  await prisma.transfer.upsert({
    where: {
      id: `${organization.id}-transfer-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-transfer-demo-1`,
      organizationId: organization.id,
      currencyId: organization.baseCurrencyId,
      sourceBankAccountId: bankAccount.id,
      destinationCashAccountId: null,
      transferDate: new Date("2026-03-22T00:00:00.000Z"),
      reference: "TR-000010",
      status: "DRAFT",
      amount: "4500000.00",
      notes: "Traslado preparado para caja operativa",
    },
  });

  await prisma.bankStatementImport.upsert({
    where: {
      id: `${organization.id}-statement-import-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-statement-import-demo-1`,
      organizationId: organization.id,
      bankAccountId: bankAccount.id,
      fileName: "extracto-marzo-demo.csv",
      status: "COMPLETED",
      rowsCount: 2,
      importedAt: new Date("2026-03-31T12:00:00.000Z"),
      lines: {
        create: [
          {
            organizationId: organization.id,
            bankAccountId: bankAccount.id,
            transactionDate: new Date("2026-03-20T00:00:00.000Z"),
            description: "Recaudo cliente Tecnologia Atlas",
            reference: "RC-0005",
            amount: "10000000.00",
            balance: "31200000.00",
          },
          {
            organizationId: organization.id,
            bankAccountId: bankAccount.id,
            transactionDate: new Date("2026-03-27T00:00:00.000Z"),
            description: "Cobro comision bancaria",
            reference: "BANK-FEE",
            amount: "-120000.00",
            balance: "31080000.00",
          },
        ],
      },
    },
  });

  await prisma.reconciliation.upsert({
    where: {
      id: `${organization.id}-reconciliation-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-reconciliation-demo-1`,
      organizationId: organization.id,
      bankAccountId: bankAccount.id,
      periodStart: new Date("2026-03-01T00:00:00.000Z"),
      periodEnd: new Date("2026-03-31T23:59:59.999Z"),
      statementBalance: "31080000.00",
      bookBalance: "31200000.00",
      status: "IN_PROGRESS",
      notes: "Pendiente por comision bancaria y validacion de corte",
    },
  });

  await prisma.asyncJob.upsert({
    where: {
      id: `${organization.id}-report-export-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-report-export-demo-1`,
      organizationId: organization.id,
      type: "reports.export",
      status: "SUCCEEDED",
      terminalAt: new Date("2026-03-31T18:00:00.000Z"),
      payload: {
        reportKey: "balance-sheet",
        asOf: "2026-03-31",
        fileName: "kaiko-balance-sheet-2026-03-31.csv",
        csvContent: "Seccion,Codigo,Cuenta,Saldo\nActivos,1110,Bancos,31200000.00",
        mimeType: "text/csv",
      },
    },
  });

  await prisma.asyncJob.upsert({
    where: {
      id: `${organization.id}-report-export-demo-2`,
    },
    update: {},
    create: {
      id: `${organization.id}-report-export-demo-2`,
      organizationId: organization.id,
      type: "reports.export",
      status: "PENDING",
      payload: {
        reportKey: "cash-flow",
        from: "2026-03-01",
        to: "2026-03-31",
      },
    },
  });

  const marchPeriod = await prisma.accountingPeriod.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      fiscalYear: 2026,
      periodNumber: 3,
    },
  });

  const bankLedgerAccount = await prisma.ledgerAccount.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      code: "1110",
    },
  });

  await prisma.documentSequence.updateMany({
    where: {
      organizationId: organization.id,
      documentType: "accounting_voucher",
      currentNumber: {
        lt: 1,
      },
    },
    data: {
      currentNumber: 1,
    },
  });

  await prisma.documentSequence.updateMany({
    where: {
      organizationId: organization.id,
      documentType: "purchase_bill",
      currentNumber: {
        lt: 1,
      },
    },
    data: {
      currentNumber: 1,
    },
  });

  await prisma.documentSequence.updateMany({
    where: {
      organizationId: organization.id,
      documentType: "journal_entry",
      currentNumber: {
        lt: 2,
      },
    },
    data: {
      currentNumber: 2,
    },
  });

  const postedVoucher = await prisma.accountingVoucher.upsert({
    where: {
      id: `${organization.id}-voucher-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-voucher-demo-1`,
      organizationId: organization.id,
      accountingPeriodId: marchPeriod.id,
      currencyId: organization.baseCurrencyId,
      voucherType: "MANUAL_ADJUSTMENT",
      voucherNumber: "AV-000001",
      description: "Reclasificacion de gasto bancario pendiente",
      entryDate: new Date("2026-03-21T12:00:00.000Z"),
      status: "POSTED",
      debitTotal: "500000.00",
      creditTotal: "500000.00",
      postedAt: new Date("2026-03-21T15:00:00.000Z"),
      lines: {
        create: [
          {
            ledgerAccountId: expenseAccount.id,
            description: "Ajuste gasto soporte bancario",
            debit: "500000.00",
            credit: "0.00",
          },
          {
            ledgerAccountId: bankLedgerAccount.id,
            description: "Salida banco por reclasificacion",
            debit: "0.00",
            credit: "500000.00",
          },
        ],
      },
    },
  });

  const journalEntry = await prisma.journalEntry.upsert({
    where: {
      organizationId_sourceType_sourceId: {
        organizationId: organization.id,
        sourceType: "ACCOUNTING_VOUCHER",
        sourceId: postedVoucher.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      accountingPeriodId: marchPeriod.id,
      currencyId: organization.baseCurrencyId,
      entryNumber: "JE-000001",
      entryDate: new Date("2026-03-21T12:00:00.000Z"),
      sourceType: "ACCOUNTING_VOUCHER",
      sourceId: postedVoucher.id,
      entryType: "MANUAL_ADJUSTMENT",
      description: postedVoucher.description,
      totalDebit: "500000.00",
      totalCredit: "500000.00",
      postedAt: new Date("2026-03-21T15:00:00.000Z"),
      lines: {
        create: [
          {
            ledgerAccountId: expenseAccount.id,
            description: "Ajuste gasto soporte bancario",
            debit: "500000.00",
            credit: "0.00",
          },
          {
            ledgerAccountId: bankLedgerAccount.id,
            description: "Salida banco por reclasificacion",
            debit: "0.00",
            credit: "500000.00",
          },
        ],
      },
    },
  });

  const purchaseJournalEntry = await prisma.journalEntry.upsert({
    where: {
      organizationId_sourceType_sourceId: {
        organizationId: organization.id,
        sourceType: "PURCHASE_BILL",
        sourceId: purchaseBill.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      accountingPeriodId: marchPeriod.id,
      currencyId: organization.baseCurrencyId,
      entryNumber: "JE-000002",
      entryDate: new Date("2026-03-17T12:00:00.000Z"),
      sourceType: "PURCHASE_BILL",
      sourceId: purchaseBill.id,
      entryType: "SYSTEM",
      description: "Factura de compra FC-000001",
      totalDebit: "2856000.00",
      totalCredit: "2856000.00",
      postedAt: new Date("2026-03-17T10:00:00.000Z"),
      lines: {
        create: [
          {
            ledgerAccountId: expenseAccount.id,
            thirdPartyId: supplier.id,
            description: "Infraestructura cloud mensual",
            debit: "2400000.00",
            credit: "0.00",
          },
          {
            ledgerAccountId: inputTaxAccount.id,
            thirdPartyId: supplier.id,
            description: "IVA descontable FC-000001",
            debit: "456000.00",
            credit: "0.00",
          },
          {
            ledgerAccountId: accountsPayableAccount.id,
            thirdPartyId: supplier.id,
            description: "CxP FC-000001",
            debit: "0.00",
            credit: "2856000.00",
          },
        ],
      },
    },
  });

  await prisma.documentLink.upsert({
    where: {
      id: `${organization.id}-document-link-voucher-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-document-link-voucher-demo-1`,
      organizationId: organization.id,
      sourceModule: "accounting",
      sourceType: "ACCOUNTING_VOUCHER",
      sourceId: postedVoucher.id,
      accountingVoucherId: postedVoucher.id,
      journalEntryId: journalEntry.id,
    },
  });

  await prisma.documentLink.upsert({
    where: {
      id: `${organization.id}-document-link-purchase-bill-demo-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-document-link-purchase-bill-demo-1`,
      organizationId: organization.id,
      sourceModule: "purchases",
      sourceType: "PURCHASE_BILL",
      sourceId: purchaseBill.id,
      journalEntryId: purchaseJournalEntry.id,
    },
  });

  await prisma.accountingVoucher.upsert({
    where: {
      id: `${organization.id}-voucher-demo-draft-1`,
    },
    update: {},
    create: {
      id: `${organization.id}-voucher-demo-draft-1`,
      organizationId: organization.id,
      accountingPeriodId: marchPeriod.id,
      currencyId: organization.baseCurrencyId,
      voucherType: "OPENING_BALANCE",
      description: "Saldo inicial banco de pruebas",
      entryDate: new Date("2026-03-25T12:00:00.000Z"),
      status: "DRAFT",
      debitTotal: "2500000.00",
      creditTotal: "2500000.00",
      lines: {
        create: [
          {
            ledgerAccountId: bankLedgerAccount.id,
            description: "Saldo inicial banco",
            debit: "2500000.00",
            credit: "0.00",
          },
          {
            ledgerAccountId: salesAccount.id,
            description: "Contrapartida temporal",
            debit: "0.00",
            credit: "2500000.00",
          },
        ],
      },
    },
  });
}
