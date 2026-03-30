import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export function TreasuryOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tesorería"
        title="Caja, bancos y conciliación"
        description="El módulo de tesorería queda preparado para movimientos manuales, extractos CSV, conciliación asistida y procesos en background para importaciones pesadas."
      />
      <EmptyState
        title="Importación y conciliación listas para cablear"
        description="La base técnica ya incluye jobs, mantenimiento y outbox para ejecutar extractos bancarios y procesos operativos sin acoplarlos al request/response."
      />
    </div>
  );
}
