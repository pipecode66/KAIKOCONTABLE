import { PageHeader } from "@/components/layout/page-header";
import { SimpleDataTable } from "@/components/data-table/simple-data-table";

const rows = [
  { key: "Zona horaria", value: "America/Bogota" },
  { key: "Locale", value: "es-CO" },
  { key: "Año fiscal", value: "Enero" },
  { key: "Formato de fecha", value: "dd/MM/yyyy" },
  { key: "Moneda base", value: "COP" },
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Parámetros organizacionales"
        description="Estos ajustes controlan períodos, formatos, reportes y consistencia operativa sin mezclarse con autenticación ni con la moneda como preocupación técnica separada."
      />
      <SimpleDataTable
        columns={[
          { key: "key", title: "Parámetro" },
          { key: "value", title: "Valor" },
        ]}
        rows={rows}
      />
    </div>
  );
}
