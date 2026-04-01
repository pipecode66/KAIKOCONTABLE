import { BookOpen, FileCheck2, Landmark, Receipt } from "lucide-react";

import { ModuleOverviewPage } from "@/components/layout/module-overview-page";
import { PurchasesSubnav } from "@/modules/purchases/ui/components/purchases-subnav";

type PurchasesOverviewPageProps = {
  organizationSlug: string;
};

export function PurchasesOverviewPage({ organizationSlug }: PurchasesOverviewPageProps) {
  return (
    <div className="space-y-6">
      <PurchasesSubnav organizationSlug={organizationSlug} activeKey="overview" />
      <ModuleOverviewPage
        eyebrow="Compras"
        title="Compras, gastos y cuentas por pagar"
        description="El modulo ya combina un overview premium con acceso directo al CRUD real de facturas proveedor y su posteo contable."
        badge="Sprint 5 en curso"
        metrics={[
          {
            title: "Compromisos",
            value: "COP 7.4M",
            caption: "Base visual para aging de proveedores, vencimientos y flujo de egresos.",
            trendLabel: "CxP",
            trend: "flat",
            tone: "ink",
            icon: Landmark,
          },
          {
            title: "Facturas proveedor",
            value: "6",
            caption: "El flujo funcional ya soporta draft, posteo y anulacion con trazabilidad.",
            trendLabel: "Operativo",
            trend: "up",
            icon: Receipt,
          },
          {
            title: "Retenciones",
            value: "6 reglas",
            caption: "La capa tributaria sigue desacoplada y lista para compras y gastos.",
            trendLabel: "Tax ready",
            trend: "up",
            tone: "emerald",
            icon: FileCheck2,
          },
          {
            title: "Gastos recurrentes",
            value: "12",
            caption: "El siguiente bloque natural es expense, pagos y allocaciones sobre esta misma base.",
            trendLabel: "Siguiente",
            trend: "flat",
            tone: "ivory",
            icon: BookOpen,
          },
        ]}
        lanes={[
          {
            title: "Operacion de compras",
            description:
              "La experiencia ya sostiene proveedores, documentos, trazabilidad y control de obligaciones sin mezclarse con las reglas contables.",
          },
          {
            title: "Compliance y reversibilidad",
            description:
              "Los asientos se publican al backend y cualquier anulacion genera reversion contable en vez de editar historia financiera.",
            tone: "dark",
          },
        ]}
        checklist={[
          {
            title: "Facturas proveedor funcionales",
            description: "La pestana de facturas ya trabaja con Prisma, permisos, secuencia e idempotencia.",
            status: "posted",
          },
          {
            title: "Gastos y pagos",
            description: "El shell ya esta listo para enganchar los siguientes CRUDs operativos sin retrabajo visual.",
            status: "active",
          },
          {
            title: "Retenciones Colombia",
            description: "Se mantiene el espacio natural para reglas por municipio, actividad y clasificacion tributaria.",
            status: "pending",
          },
        ]}
        table={{
          title: "Focos del modulo",
          description: "Estos streams pueden entrar de forma incremental sobre la misma base tecnica.",
          rows: [
            {
              stream: "Purchase bills",
              focus: "CRUD, posteo, anulacion y vinculo al journal entry",
              readiness: "Operativo",
            },
            {
              stream: "Expenses",
              focus: "Registro de gasto con tercero, centros de costo y adjuntos",
              readiness: "Siguiente bloque",
            },
            {
              stream: "AP control",
              focus: "Pagos aplicados, aging y control de obligaciones",
              readiness: "Base tecnica lista",
            },
          ],
        }}
        emptyState={{
          title: "Compras ya tiene una superficie creible",
          description:
            "El shell premium ya sostiene tablas, filtros, estados y CTA para aterrizar operacion real de proveedores.",
        }}
      />
    </div>
  );
}
