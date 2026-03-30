import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventas"
        title="Facturación y cuentas por cobrar"
        description="Las facturas de venta, cobros y secuencias documentales ya tienen una base clara para draft, posteo, anulación y vínculo contable."
      />
      <Card className="rounded-[28px] border-emerald-950/5 bg-white/90">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Cobertura del MVP base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
          <p>Facturas con estado `draft`, `posted` y `voided`.</p>
          <p>Preparación para numeración fiscal y futura integración DIAN.</p>
          <p>Montos persistidos con `Decimal` y tax engine parametrizable.</p>
        </CardContent>
      </Card>
    </div>
  );
}
