import { BarChart3, FileSpreadsheet, Scale, Wallet } from "lucide-react";

import { ModuleOverviewPage } from "@/components/layout/module-overview-page";

export function ReportsOverviewPage() {
  return (
    <ModuleOverviewPage
      eyebrow="Reportes"
      title="Paquete financiero y lectura ejecutiva"
      description="La capa de reportes ya tiene una superficie premium para balance general, PyG, comprobacion, aging y exportaciones pesadas con una experiencia sobria y muy clara."
      badge="Read model ready"
      metrics={[
        {
          title: "Balance general",
          value: "Listo",
          caption: "Tarjeta reservada para fotografia financiera por fecha y organizacion.",
          trendLabel: "Core",
          trend: "up",
          tone: "emerald",
          icon: Scale,
        },
        {
          title: "Estado de resultados",
          value: "Listo",
          caption: "Vista pensada para lectura de margen, gasto y utilidad en segundos.",
          trendLabel: "P&L",
          trend: "up",
          icon: BarChart3,
        },
        {
          title: "Aging CxC / CxP",
          value: "2 vistas",
          caption: "Lugar natural para vencimientos y lectura de riesgo operativo.",
          trendLabel: "Soon",
          trend: "flat",
          tone: "ivory",
          icon: Wallet,
        },
        {
          title: "Exportaciones",
          value: "Background",
          caption: "Outbox y AsyncJob dejan lista la salida de reportes pesados.",
          trendLabel: "Outbox",
          trend: "up",
          tone: "ink",
          icon: FileSpreadsheet,
        },
      ]}
      lanes={[
        {
          title: "Lectura para management",
          description:
            "Las superficies del modulo priorizan claridad, jerarquia y rapidez para usuarios no contadores sin sacrificar rigor financiero.",
        },
        {
          title: "Query layer separada",
          description:
            "La experiencia deja espacio para read models, agregaciones y exportaciones sin contaminar el dominio ni la UI con reglas de negocio.",
          tone: "dark",
        },
      ]}
      checklist={[
        {
          title: "Balance y resultados",
          description: "Las tarjetas y tablas ya reflejan la narrativa final del modulo.",
          status: "active",
        },
        {
          title: "Exportacion pesada",
          description: "Se podra despachar via outbox y procesar via jobs sin bloquear al usuario.",
          status: "pending",
        },
        {
          title: "Formatos organizacionales",
          description: "Reportes y exportaciones leyeran timezone, locale y dateFormat de OrganizationSettings.",
          status: "posted",
        },
      ]}
      table={{
        title: "Streams del paquete financiero",
        description: "Cada vista importante ya tiene un lugar coherente en el producto.",
        rows: [
          {
            stream: "Financial statements",
            focus: "Balance general, resultados y comprobacion",
            readiness: "Shell premium listo",
          },
          {
            stream: "Aging reports",
            focus: "Cartera y obligaciones por vencimiento",
            readiness: "Diseño listo",
          },
          {
            stream: "Exports",
            focus: "Excel, CSV y procesos pesados en background",
            readiness: "Infra lista",
          },
        ],
      }}
      emptyState={{
        title: "Reportes listos para conectarse",
        description:
          "La base visual ya transmite inteligencia financiera y control, dejando el modulo listo para consultas reales.",
      }}
    />
  );
}
