export async function getDashboardOverview() {
  return {
    metrics: [
      {
        title: "Ingresos netos",
        value: "COP 48.3M",
        caption: "Facturacion del periodo con una mezcla sana entre ventas cobradas y cartera viva.",
        trendLabel: "+12.4%",
        trend: "up" as const,
        tone: "emerald" as const,
      },
      {
        title: "Gasto operativo",
        value: "COP 19.8M",
        caption: "Compras, gastos y cargas del periodo listas para drill-down por documento.",
        trendLabel: "-3.1%",
        trend: "down" as const,
        tone: "ivory" as const,
      },
      {
        title: "Utilidad",
        value: "COP 28.5M",
        caption: "Lectura ejecutiva inmediata para founders, finance y operaciones.",
        trendLabel: "+18.7%",
        trend: "up" as const,
        tone: "ink" as const,
      },
      {
        title: "Bancos",
        value: "COP 31.2M",
        caption: "Saldo disponible distribuido entre cuentas operativas y reserva de caja.",
        trendLabel: "4 cuentas",
        trend: "up" as const,
        tone: "ivory" as const,
      },
      {
        title: "CxC",
        value: "COP 12.9M",
        caption: "Cartera abierta con foco en vencimientos cercanos y efectividad de recaudo.",
        trendLabel: "11 abiertas",
        trend: "flat" as const,
        tone: "ivory" as const,
      },
      {
        title: "CxP",
        value: "COP 7.4M",
        caption: "Obligaciones de corto plazo para proteger liquidez y calendario de pagos.",
        trendLabel: "8 por vencer",
        trend: "flat" as const,
        tone: "ivory" as const,
      },
    ],
    executiveNotes: [
      {
        title: "Pulso del dia",
        description:
          "La caja operativa esta sana y la utilidad del mes absorbe el plan de gastos sin tensionar tesoreria.",
      },
      {
        title: "Riesgo controlado",
        description:
          "La exposicion de cartera esta concentrada en pocos clientes y permite seguimiento con acciones concretas.",
      },
      {
        title: "Momento para cierre",
        description:
          "Los datos de tesoreria y ventas muestran una ventana clara para preparar el siguiente cierre mensual.",
      },
    ],
    alerts: [
      {
        title: "Conciliacion pendiente",
        description: "Dos extractos bancarios siguen esperando matching manual asistido.",
        status: "open" as const,
      },
      {
        title: "Periodo pre cierre",
        description: "Abril ya tiene mas del 92% de documentos listos para validacion final.",
        status: "pending" as const,
      },
      {
        title: "Terceros por actualizar",
        description: "Tres perfiles tributarios requieren completar responsabilidades e ICA.",
        status: "active" as const,
      },
    ],
    recentMovements: [
      {
        document: "FV-2026-0142",
        module: "Ventas",
        counterparty: "Inversiones Prisma SAS",
        amount: "COP 14.280.000",
        status: "posted" as const,
      },
      {
        document: "EX-2026-0081",
        module: "Compras",
        counterparty: "Servicios Delta",
        amount: "COP 2.856.000",
        status: "posted" as const,
      },
      {
        document: "RC-2026-0033",
        module: "Tesoreria",
        counterparty: "Cobro aplicado a FV-0140",
        amount: "COP 10.000.000",
        status: "posted" as const,
      },
      {
        document: "TR-2026-0010",
        module: "Tesoreria",
        counterparty: "Transferencia banco a caja",
        amount: "COP 4.500.000",
        status: "draft" as const,
      },
      {
        document: "AJ-2026-0003",
        module: "Contabilidad",
        counterparty: "Provision de cierre mensual",
        amount: "COP 1.920.000",
        status: "voided" as const,
      },
    ],
    readinessLanes: [
      {
        title: "Revenue engine",
        description: "Ventas y recaudo ya muestran la forma final del cockpit comercial dentro del workspace.",
        status: "posted" as const,
      },
      {
        title: "Treasury operations",
        description: "Bancos, caja y conciliacion tienen una base visual lista para volverse operacion diaria.",
        status: "active" as const,
      },
      {
        title: "Reporting pack",
        description: "Balance, PyG y aging quedaran enchufados a este shell sin rehacer la narrativa del producto.",
        status: "pending" as const,
      },
    ],
    modulePosture: [
      { module: "Organizaciones", headline: "1 activa", posture: "Base de multiempresa visible", status: "active" as const },
      { module: "Admin", headline: "Control de acceso", posture: "Roles y permisos listos para CRUD", status: "active" as const },
      { module: "Contabilidad", headline: "Plan de cuentas", posture: "Catalogo real ya operativo", status: "posted" as const },
      { module: "Tesoreria", headline: "Importaciones", posture: "Jobs y maintenance listos", status: "pending" as const },
    ],
  };
}
