import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountingOverviewPage() {
  const highlights = [
    "Motor contable preparado para posteo automático, reversión e idempotencia.",
    "Soporte explícito para ajustes manuales, saldos iniciales y cierre de períodos.",
    "Tax engine desacoplado con reglas vigentes, prioridad y bases mínimas.",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contabilidad"
        title="Motor contable y control de períodos"
        description="La base contable separa documentos operativos de asientos, protege los períodos cerrados y deja el terreno listo para ajustes, cierre y trazabilidad fuerte."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item} className="rounded-[28px] border-emerald-950/5 bg-white/90">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Base implementada</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">{item}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
