import { ArrowLeftRight, Landmark, ShieldEllipsis, Wallet } from "lucide-react";

import { ModuleOverviewPage } from "@/components/layout/module-overview-page";

export function TreasuryOverviewPage() {
  return (
    <ModuleOverviewPage
      eyebrow="Tesoreria"
      title="Caja, bancos y conciliacion"
      description="Tesoreria arranca con una presencia visual fuerte para saldos, importacion de extractos y conciliacion asistida, manteniendo el tono corporativo de KAIKO."
      badge="Jobs + outbox ready"
      metrics={[
        {
          title: "Saldo bancos",
          value: "COP 31.2M",
          caption: "Lectura inmediata del frente bancario con espacio para multicuenta.",
          trendLabel: "4 cuentas",
          trend: "up",
          tone: "emerald",
          icon: Landmark,
        },
        {
          title: "Caja",
          value: "COP 2.8M",
          caption: "Bloque listo para arqueo, movimientos manuales y cash posture.",
          trendLabel: "Operativa",
          trend: "flat",
          icon: Wallet,
        },
        {
          title: "Conciliaciones",
          value: "2 pendientes",
          caption: "La interfaz ya reserva estados claros para matching manual asistido.",
          trendLabel: "Atencion",
          trend: "down",
          tone: "ink",
          icon: ArrowLeftRight,
        },
        {
          title: "Procesos async",
          value: "CSV / exports",
          caption: "Importaciones grandes y tareas de soporte ya tienen destino fuera del request.",
          trendLabel: "Background",
          trend: "up",
          tone: "ivory",
          icon: ShieldEllipsis,
        },
      ]}
      lanes={[
        {
          title: "Operacion de tesoreria",
          description:
            "La vista principal prioriza control de saldos, conciliaciones y movimientos intercuenta con superficies claras y muy legibles.",
        },
        {
          title: "Motor operativo resiliente",
          description:
            "Jobs, outbox y maintenance ya tienen un lugar claro en la experiencia para que la operacion no dependa del request/response.",
          tone: "dark",
        },
      ]}
      checklist={[
        {
          title: "Movimientos manuales",
          description: "La UI ya contempla una tabla operativa con filtros, estados y acciones contextuales.",
          status: "active",
        },
        {
          title: "Importacion CSV",
          description: "El shell deja claro que el procesamiento pesado correra en background.",
          status: "pending",
        },
        {
          title: "Conciliacion bancaria",
          description: "Existe una superficie lista para matching, confirmacion y saldo conciliado.",
          status: "open",
        },
      ]}
      table={{
        title: "Focos del modulo",
        description: "Los siguientes bloques funcionales ya tienen un espacio visual coherente y reutilizable.",
        rows: [
          {
            stream: "Bank accounts",
            focus: "Saldos, movimientos y conciliacion por cuenta",
            readiness: "Shell listo",
          },
          {
            stream: "Cash accounts",
            focus: "Arqueo y seguimiento operativo de caja",
            readiness: "Diseño listo",
          },
          {
            stream: "Statement imports",
            focus: "Procesamiento CSV, sugerencias y reintentos",
            readiness: "Infra lista",
          },
        ],
      }}
      emptyState={{
        title: "Tesoreria lista para conectarse",
        description:
          "La capa visual ya esta alineada con conciliacion, procesos async y control operativo diario.",
      }}
    />
  );
}
