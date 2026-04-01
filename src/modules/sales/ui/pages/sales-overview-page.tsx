import { CircleDollarSign, CreditCard, FileStack, ReceiptText } from "lucide-react";

import { ModuleOverviewPage } from "@/components/layout/module-overview-page";
import { SalesSubnav } from "@/modules/sales/ui/components/sales-subnav";

type SalesOverviewPageProps = {
  organizationSlug: string;
};

export function SalesOverviewPage({ organizationSlug }: SalesOverviewPageProps) {
  return (
    <div className="space-y-6">
      <SalesSubnav organizationSlug={organizationSlug} activeKey="overview" />
      <ModuleOverviewPage
        eyebrow="Ventas"
        title="Facturacion y cuentas por cobrar"
        description="El modulo ya combina un overview premium con acceso directo al CRUD real de facturas y su publicacion contable."
        badge="Sprint 5 en curso"
        metrics={[
          {
            title: "Pipeline mensual",
            value: "COP 48.3M",
            caption: "Meta visual para ingresos, cobro y aging de clientes.",
            trendLabel: "+12.4%",
            trend: "up",
            tone: "emerald",
            icon: CircleDollarSign,
          },
          {
            title: "Facturas abiertas",
            value: "11",
            caption: "Ahora puedes abrir el flujo funcional y publicarlas con asiento automatico.",
            trendLabel: "CxC",
            trend: "flat",
            icon: ReceiptText,
          },
          {
            title: "Cobros registrados",
            value: "7",
            caption: "La siguiente capa natural es tesoreria con allocaciones y recaudos aplicados.",
            trendLabel: "Hoy",
            trend: "up",
            tone: "ivory",
            icon: CreditCard,
          },
          {
            title: "Secuencias activas",
            value: "2",
            caption: "Numeracion controlada al publicar y journal asociado.",
            trendLabel: "Atomicas",
            trend: "up",
            tone: "ink",
            icon: FileStack,
          },
        ]}
        lanes={[
          {
            title: "Front office comercial",
            description:
              "El modulo ya refleja una experiencia de producto real para facturacion, cobranza y seguimiento de cartera sin parecer una plantilla generica.",
          },
          {
            title: "Back office contable",
            description:
              "Las publicaciones, anulaciones y secuencias viven desacopladas del frontend, con reglas reales en application y accounting.",
            tone: "dark",
          },
        ]}
        checklist={[
          {
            title: "Facturas de venta funcionales",
            description: "El CRUD real ya existe en la pestaña de facturas con draft, post y void.",
            status: "posted",
          },
          {
            title: "CxC y cobranza",
            description: "La estructura visual ya sostiene aging, pagos y detalle de cliente.",
            status: "active",
          },
          {
            title: "Factura electronica",
            description: "Se deja espacio claro para futuros estados e integraciones sin contaminar el shell.",
            status: "pending",
          },
        ]}
        table={{
          title: "Focos del modulo",
          description:
            "Estos streams entran de forma incremental sin tener que redibujar el producto.",
          rows: [
            {
              stream: "Sales invoices",
              focus: "CRUD, posteo, anulacion y vinculo contable",
              readiness: "Operativo",
            },
            {
              stream: "Payments received",
              focus: "Aplicacion de cobros y aging de clientes",
              readiness: "Siguiente bloque",
            },
            {
              stream: "Document sequencing",
              focus: "Control transaccional e idempotente",
              readiness: "Base tecnica lista",
            },
          ],
        }}
        emptyState={{
          title: "Ventas ya tiene una superficie creible",
          description:
            "El shell premium ya sostiene tablas, filtros, estados y CTA para aterrizar operacion comercial real.",
        }}
      />
    </div>
  );
}
