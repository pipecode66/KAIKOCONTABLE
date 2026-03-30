export type DashboardMetric = {
  title: string;
  value: string;
  trend: string;
};

export async function getDashboardOverview() {
  return {
    metrics: [
      { title: "Ingresos", value: "$ 48.3M", trend: "+12.4% vs mes anterior" },
      { title: "Gastos", value: "$ 19.8M", trend: "-3.1% vs mes anterior" },
      { title: "Utilidad", value: "$ 28.5M", trend: "+18.7% vs mes anterior" },
      { title: "Bancos", value: "$ 31.2M", trend: "4 cuentas conciliables" },
      { title: "CxC", value: "$ 12.9M", trend: "11 facturas abiertas" },
      { title: "CxP", value: "$ 7.4M", trend: "8 obligaciones por vencer" },
    ] satisfies DashboardMetric[],
    alerts: [
      "2 extractos bancarios pendientes por conciliar.",
      "1 período listo para cierre mensual.",
      "3 terceros requieren actualización tributaria.",
    ],
    recentMovements: [
      { title: "Factura FV-2026-0142", amount: "$ 14.280.000", status: "posted" },
      { title: "Gasto EX-2026-0081", amount: "$ 2.856.000", status: "posted" },
      { title: "Cobro RC-2026-0033", amount: "$ 10.000.000", status: "posted" },
      { title: "Transferencia TR-2026-0010", amount: "$ 4.500.000", status: "draft" },
    ],
  };
}
