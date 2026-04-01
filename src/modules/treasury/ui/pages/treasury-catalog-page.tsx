import Link from "next/link";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { EmptyState } from "@/components/feedback/empty-state";
import { CatalogArchiveButton } from "@/components/form/catalog-archive-button";
import { CatalogFormDialog, type CatalogFieldConfig } from "@/components/form/catalog-form-dialog";
import { StatusPill } from "@/components/layout/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { treasuryCatalogMeta } from "@/modules/treasury/dto/catalogs.dto";
import { TreasuryCatalogNav } from "@/modules/treasury/ui/components/treasury-catalog-nav";
import type {
  CatalogActionResult,
  CatalogFilters,
  CatalogPagination,
} from "@/modules/shared/dto/catalog-management.dto";

type CatalogRow = {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  summary: string;
  detail: string;
  columns: Record<string, string>;
  raw: Record<string, unknown>;
};

type TreasuryCatalogPageProps = {
  organizationSlug: string;
  organizationName: string;
  catalog: TreasuryCatalogKey;
  filters: CatalogFilters;
  pagination: CatalogPagination;
  rows: CatalogRow[];
  fields: CatalogFieldConfig[];
  canManage: boolean;
  formTitle: string;
  formDescription: string;
  saveAction: (
    state: CatalogActionResult,
    formData: FormData,
  ) => Promise<CatalogActionResult>;
  archiveAction: (id: string) => Promise<CatalogActionResult>;
};

export function TreasuryCatalogPage({
  organizationSlug,
  organizationName,
  catalog,
  filters,
  pagination,
  rows,
  fields,
  canManage,
  formTitle,
  formDescription,
  saveAction,
  archiveAction,
}: TreasuryCatalogPageProps) {
  const meta = treasuryCatalogMeta[catalog];
  const basePath = `/${organizationSlug}/treasury/catalogs/${catalog}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogos de tesoreria"
        title={meta.title}
        description={meta.description}
        badge={organizationName}
        actions={
          <div className="flex flex-wrap gap-3">
            <TreasuryCatalogNav organizationSlug={organizationSlug} activeKey={catalog} />
            {canManage ? (
              <CatalogFormDialog
                title={formTitle}
                description={formDescription}
                fields={fields}
                action={saveAction}
              />
            ) : null}
          </div>
        }
      />

      <BaseDataTable
        title={meta.title}
        description="CRUD real para tesoreria con filtros, paginacion y archivado seguro."
        toolbar={
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar..."
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
            <select
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="ARCHIVED">Archivados</option>
            </select>
            <Button type="submit" size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
              Filtrar
            </Button>
            <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
              <Link href={basePath}>Limpiar</Link>
            </Button>
          </form>
        }
        columns={[
          {
            key: "summary",
            title: "Registro",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-950">{row.summary}</p>
                <p className="text-xs text-slate-500">{row.detail}</p>
              </div>
            ),
          },
          ...Object.keys(rows[0]?.columns ?? { value: "" }).map((columnKey) => ({
            key: columnKey as keyof CatalogRow,
            title: columnKey,
            render: (row: CatalogRow) => row.columns[columnKey],
          })),
          {
            key: "status",
            title: "Estado",
            render: (row) => <StatusPill status={row.status.toLowerCase() as "active" | "archived"} />,
          },
          {
            key: "id",
            title: "Acciones",
            className: "w-[220px]",
            render: (row) =>
              canManage ? (
                <div className="flex flex-wrap gap-2">
                  <CatalogFormDialog
                    title={formTitle}
                    description={formDescription}
                    fields={fields}
                    initialValues={row.raw as Record<string, string | boolean | null | undefined>}
                    action={saveAction}
                  />
                  {row.status !== "ARCHIVED" ? (
                    <CatalogArchiveButton onArchive={() => archiveAction(row.id)} />
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-slate-500">Solo lectura</span>
              ),
          },
        ]}
        rows={rows}
        emptyState={
          <EmptyState
            title={`Sin ${meta.title.toLowerCase()}`}
            description="Aun no hay registros para esta organizacion con los filtros aplicados."
          />
        }
      />

      <PaginationControls basePath={basePath} filters={filters} pagination={pagination} />
    </div>
  );
}
