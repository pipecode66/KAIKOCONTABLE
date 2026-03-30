import { PageHeader } from "@/components/layout/page-header";
import { SimpleDataTable } from "@/components/data-table/simple-data-table";

const rows = [
  { area: "Usuarios", focus: "Memberships, roles y control de acceso" },
  { area: "Permisos", focus: "Matriz backend por módulo y acción" },
  { area: "Configuración", focus: "Parámetros organizacionales y políticas" },
];

export function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Gobierno de acceso y configuración"
        description="Desde aquí viven la multiempresa real, la asignación de memberships y la configuración operativa que luego consumen reportes, cierres y exportaciones."
      />
      <SimpleDataTable
        columns={[
          { key: "area", title: "Área" },
          { key: "focus", title: "Cobertura base implementada" },
        ]}
        rows={rows}
      />
    </div>
  );
}
