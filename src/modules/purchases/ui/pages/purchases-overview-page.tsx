import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PurchasesOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compras"
        title="Facturas de compra y gastos"
        description="La base del módulo cubre cuentas por pagar, gastos y sus vínculos con impuestos, retenciones y asientos automáticos."
      />
      <Card className="rounded-[28px] border-emerald-950/5 bg-white/90">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Trazabilidad operativa</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-slate-600">
          Todos los documentos críticos quedan preparados para `voidReason`, publicación controlada y auditoría completa.
        </CardContent>
      </Card>
    </div>
  );
}
