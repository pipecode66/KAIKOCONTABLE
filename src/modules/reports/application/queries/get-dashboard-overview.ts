import { prisma } from "@/lib/prisma/client";
import { getIncomeStatementReport, getReportsOverview } from "@/modules/reports/application/queries/get-reports-page-data";
import { getTreasuryOverview } from "@/modules/treasury/application/queries/get-treasury-page-data";

function startOfCurrentMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardOverview(input: {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}) {
  const [reportsOverview, treasuryOverview, incomeStatement, recentDocuments] = await Promise.all([
    getReportsOverview({
      organizationId: input.organizationId,
    }),
    getTreasuryOverview(input),
    getIncomeStatementReport({
      organizationId: input.organizationId,
      from: startOfCurrentMonthIso(),
      to: todayIso(),
    }),
    Promise.all([
      prisma.salesInvoice.findMany({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
      prisma.purchaseBill.findMany({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
        },
        include: {
          supplier: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
      prisma.payment.findMany({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
        },
        include: {
          thirdParty: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
      prisma.transfer.findMany({
        where: {
          organizationId: input.organizationId,
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
    ]),
  ]);

  const revenue = incomeStatement.sections.find((section) => section.key === "revenue")?.total ?? "0.00";
  const expenses = incomeStatement.sections
    .filter((section) => section.key === "expenses" || section.key === "cost-of-sales")
    .reduce((acc, section) => acc + Number(section.total), 0)
    .toFixed(2);

  const [salesInvoices, purchaseBills, payments, transfers] = recentDocuments;
  const recentMovements = [
    ...salesInvoices.map((row) => ({
      document: row.documentNumber ?? row.internalNumber,
      module: "Ventas",
      counterparty: row.customer.name,
      amount: row.total.toString(),
      status: row.status.toLowerCase() as "draft" | "posted" | "voided",
      updatedAt: row.updatedAt,
    })),
    ...purchaseBills.map((row) => ({
      document: row.documentNumber ?? row.internalNumber,
      module: "Compras",
      counterparty: row.supplier.name,
      amount: row.total.toString(),
      status: row.status.toLowerCase() as "draft" | "posted" | "voided",
      updatedAt: row.updatedAt,
    })),
    ...payments.map((row) => ({
      document: row.reference ?? `PAY-${row.id.slice(-6)}`,
      module: "Tesoreria",
      counterparty: row.thirdParty?.name ?? "Sin tercero",
      amount: row.amount.toString(),
      status: row.status.toLowerCase() as "draft" | "posted" | "voided",
      updatedAt: row.updatedAt,
    })),
    ...transfers.map((row) => ({
      document: row.reference ?? `TR-${row.id.slice(-6)}`,
      module: "Tesoreria",
      counterparty: "Traslado interno",
      amount: row.amount.toString(),
      status: row.status.toLowerCase() as "draft" | "posted" | "voided",
      updatedAt: row.updatedAt,
    })),
  ]
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 8)
    .map((movement) => ({
      document: movement.document,
      module: movement.module,
      counterparty: movement.counterparty,
      amount: movement.amount,
      status: movement.status,
    }));

  return {
    metrics: [
      {
        title: "Ingresos netos",
        value: revenue,
        caption: "Ingresos reconocidos en el periodo actual.",
        trendLabel: "Resultados",
        trend: "up" as const,
        tone: "emerald" as const,
      },
      {
        title: "Gasto operativo",
        value: expenses,
        caption: "Costo y gasto reconocidos en el mismo rango.",
        trendLabel: "Periodo",
        trend: "flat" as const,
        tone: "ivory" as const,
      },
      {
        title: "Utilidad",
        value: incomeStatement.netIncome,
        caption: "Resultado neto del periodo actual.",
        trendLabel: "P&L",
        trend: Number(incomeStatement.netIncome) >= 0 ? ("up" as const) : ("down" as const),
        tone: "ink" as const,
      },
      {
        title: "Bancos",
        value: treasuryOverview.metrics.availableBanks,
        caption: "Saldo agregado de cuentas bancarias activas.",
        trendLabel: `${treasuryOverview.bankBalances.length} cuentas`,
        trend: "up" as const,
        tone: "ivory" as const,
      },
      {
        title: "CxC",
        value: reportsOverview.metrics.openReceivables,
        caption: "Cartera abierta por cobrar.",
        trendLabel: "Aging",
        trend: "flat" as const,
        tone: "ivory" as const,
      },
      {
        title: "CxP",
        value: reportsOverview.metrics.openPayables,
        caption: "Obligaciones abiertas por pagar.",
        trendLabel: "Tesoreria",
        trend: "flat" as const,
        tone: "ivory" as const,
      },
    ],
    executiveNotes: [
      {
        title: "Liquidez visible",
        description: `La tesoreria muestra ${treasuryOverview.bankBalances.length} cuentas bancarias y ${treasuryOverview.cashBalances.length} cajas activas dentro del workspace.`,
      },
      {
        title: "Lectura financiera consistente",
        description: `Los activos ascienden a ${reportsOverview.metrics.assets} y la utilidad del periodo cierra en ${incomeStatement.netIncome}.`,
      },
      {
        title: "Operacion pendiente",
        description: `${treasuryOverview.metrics.pendingImports} extractos y ${treasuryOverview.metrics.openReconciliations} conciliaciones siguen abiertos para cierre operativo.`,
      },
    ],
    alerts: [
      {
        title: "Conciliacion pendiente",
        description: `${treasuryOverview.metrics.openReconciliations} conciliaciones siguen esperando confirmacion.`,
        status: treasuryOverview.metrics.openReconciliations > 0 ? ("open" as const) : ("posted" as const),
      },
      {
        title: "Extractos por procesar",
        description: `${treasuryOverview.metrics.pendingImports} importaciones de extracto siguen en cola o requieren revision.`,
        status: treasuryOverview.metrics.pendingImports > 0 ? ("pending" as const) : ("posted" as const),
      },
      {
        title: "Cartera viva",
        description: `CxC abierta por ${reportsOverview.metrics.openReceivables} y CxP por ${reportsOverview.metrics.openPayables}.`,
        status: "active" as const,
      },
    ],
    recentMovements,
    readinessLanes: [
      {
        title: "Revenue engine",
        description: "Ventas, compras y tesoreria ya publican documentos reales con trazabilidad completa.",
        status: "posted" as const,
      },
      {
        title: "Treasury operations",
        description: "Bancos, caja, extractos y conciliacion ya operan sobre backend real.",
        status: "posted" as const,
      },
      {
        title: "Reporting pack",
        description: "Balance, resultados, aging y exportaciones se alimentan del mayor y los documentos abiertos.",
        status: "posted" as const,
      },
    ],
    modulePosture: [
      { module: "Organizaciones", headline: input.organizationName, posture: "Workspace activo y resuelto por slug", status: "posted" as const },
      { module: "Admin", headline: "Roles y permisos", posture: "Autorizacion por organizacion aplicada en servidor", status: "posted" as const },
      { module: "Contabilidad", headline: "Motor contable", posture: "Asientos, periodos y reversión activos", status: "posted" as const },
      { module: "Tesoreria", headline: "Operaciones y conciliacion", posture: "Pagos, traslados, importaciones y match asistido", status: "posted" as const },
    ],
  };
}
