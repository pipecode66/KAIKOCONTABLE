import { notFound } from "next/navigation";

import { saveTreasuryCatalogAction, archiveTreasuryCatalogAction } from "@/modules/treasury/application/commands/catalogs.commands";
import { getTreasuryCatalogPageData } from "@/modules/treasury/application/queries/get-treasury-catalog-page-data";
import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { treasuryCatalogMeta } from "@/modules/treasury/dto/catalogs.dto";
import { TreasuryCatalogPage } from "@/modules/treasury/ui/pages/treasury-catalog-page";
import { catalogFiltersSchema } from "@/modules/shared/validators/catalog-filters.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

const allowedCatalogs: TreasuryCatalogKey[] = [
  "payment-methods",
  "bank-accounts",
  "cash-accounts",
];

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function serializeRow(raw: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      if (typeof value === "boolean") {
        return [key, value];
      }

      return [key, value == null ? "" : String(value)];
    }),
  );
}

function getFields(catalog: TreasuryCatalogKey) {
  switch (catalog) {
    case "payment-methods":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "TRANSFER" },
        { name: "name", label: "Nombre", type: "text", placeholder: "Transferencia bancaria" },
        { name: "description", label: "Descripcion", type: "textarea" },
      ] as const;
    case "bank-accounts":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "BANCO-001" },
        { name: "name", label: "Nombre", type: "text", placeholder: "Cuenta principal" },
        { name: "bankName", label: "Banco", type: "text", placeholder: "Bancolombia" },
        { name: "accountNumber", label: "Numero de cuenta", type: "text" },
        { name: "accountType", label: "Tipo de cuenta", type: "text", placeholder: "checking" },
      ] as const;
    case "cash-accounts":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "CAJA-001" },
        { name: "name", label: "Nombre", type: "text", placeholder: "Caja principal" },
        { name: "location", label: "Ubicacion", type: "text", placeholder: "Bogota" },
      ] as const;
  }
}

export default async function TreasuryCatalogRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string; catalog: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug, catalog } = await params;

  if (!allowedCatalogs.includes(catalog as TreasuryCatalogKey)) {
    notFound();
  }

  const resolvedCatalog = catalog as TreasuryCatalogKey;
  const rawSearchParams = await searchParams;
  const filters = catalogFiltersSchema.parse({
    q: getSingleValue(rawSearchParams.q),
    status: getSingleValue(rawSearchParams.status),
    page: getSingleValue(rawSearchParams.page),
  });

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const canManage = hasAnyOrganizationPermission(context, ["treasury.manage", "catalogs.manage"]);
  const result = await getTreasuryCatalogPageData({
    organizationId: context.membership.organizationId,
    catalog: resolvedCatalog,
    filters,
  });

  const rows = result.rows.map((row) => ({
    ...row,
    raw: serializeRow(row.raw),
  }));

  return (
    <TreasuryCatalogPage
      organizationSlug={organizationSlug}
      organizationName={context.membership.organization.name}
      catalog={resolvedCatalog}
      filters={filters}
      pagination={{
        page: filters.page,
        pageSize: 10,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / 10)),
      }}
      rows={rows}
      fields={[...getFields(resolvedCatalog)]}
      canManage={canManage}
      formTitle={treasuryCatalogMeta[resolvedCatalog].title}
      formDescription={treasuryCatalogMeta[resolvedCatalog].description}
      saveAction={saveTreasuryCatalogAction.bind(null, organizationSlug, resolvedCatalog)}
      archiveAction={archiveTreasuryCatalogAction.bind(null, organizationSlug, resolvedCatalog)}
    />
  );
}
