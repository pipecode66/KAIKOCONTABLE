import { notFound } from "next/navigation";

import { getAccountingCatalogPageData } from "@/modules/accounting/application/queries/get-accounting-catalog-page-data";
import { saveAccountingCatalogAction, archiveAccountingCatalogAction } from "@/modules/accounting/application/commands/catalogs.commands";
import {
  accountingCatalogMeta,
  taxKindOptions,
  taxTreatmentOptions,
  thirdPartyTaxClassificationOptions,
  thirdPartyTypeOptions,
  vatResponsibilityOptions,
  type AccountingCatalogKey,
} from "@/modules/accounting/dto/catalogs.dto";
import { AccountingCatalogPage } from "@/modules/accounting/ui/pages/accounting-catalog-page";
import { catalogFiltersSchema } from "@/modules/shared/validators/catalog-filters.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

const allowedCatalogs: AccountingCatalogKey[] = [
  "third-parties",
  "taxes",
  "tax-rules",
  "cost-centers",
  "catalog-items",
];

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function serializeRow(catalog: AccountingCatalogKey, raw: Record<string, unknown>) {
  if (catalog === "tax-rules") {
    return {
      id: String(raw.id ?? ""),
      taxId: String(raw.taxId ?? ""),
      name: String(raw.name ?? ""),
      effectiveFrom: typeof raw.effectiveFrom === "object" && raw.effectiveFrom instanceof Date ? raw.effectiveFrom.toISOString().slice(0, 10) : "",
      effectiveTo:
        typeof raw.effectiveTo === "object" && raw.effectiveTo instanceof Date
          ? raw.effectiveTo.toISOString().slice(0, 10)
          : "",
      minimumBaseAmount: raw.minimumBaseAmount ? String(raw.minimumBaseAmount) : "",
      rateOverride: raw.rateOverride ? String(raw.rateOverride) : "",
      priority: String(raw.priority ?? "100"),
      thirdPartyType: String(raw.thirdPartyType ?? ""),
      thirdPartyTaxClassification: String(raw.thirdPartyTaxClassification ?? ""),
      vatResponsibility: String(raw.vatResponsibility ?? ""),
      municipalityCode: String(raw.municipalityCode ?? ""),
      economicActivityCode: String(raw.economicActivityCode ?? ""),
      fiscalTreatment: String(raw.fiscalTreatment ?? ""),
      documentType: String(raw.documentType ?? ""),
      operationType: String(raw.operationType ?? ""),
    };
  }

  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      if (value instanceof Date) {
        return [key, value.toISOString().slice(0, 10)];
      }

      if (typeof value === "boolean") {
        return [key, value];
      }

      return [key, value == null ? "" : String(value)];
    }),
  );
}

function getFields(
  catalog: AccountingCatalogKey,
  dependencies: Awaited<ReturnType<typeof getAccountingCatalogPageData>>["dependencies"],
) {
  switch (catalog) {
    case "third-parties":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "CLI-001" },
        { name: "name", label: "Nombre comercial", type: "text", placeholder: "Tecnologia Atlas SAS" },
        { name: "legalName", label: "Razon social", type: "text" },
        { name: "taxId", label: "NIT / identificacion", type: "text" },
        { name: "email", label: "Correo", type: "text" },
        { name: "phone", label: "Telefono", type: "text" },
        { name: "type", label: "Tipo", type: "select", options: thirdPartyTypeOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "taxClassification", label: "Clasificacion tributaria", type: "select", options: thirdPartyTaxClassificationOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "vatResponsibility", label: "Responsabilidad IVA", type: "select", options: vatResponsibilityOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "municipalityCode", label: "Municipio", type: "text" },
        { name: "economicActivityCode", label: "Actividad economica", type: "text" },
        { name: "isWithholdingAgent", label: "Agente retenedor", type: "checkbox", description: "Marca si el tercero actua como agente retenedor." },
      ] as const;
    case "taxes":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "IVA19" },
        { name: "name", label: "Nombre", type: "text", placeholder: "IVA 19%" },
        { name: "kind", label: "Tipo", type: "select", options: taxKindOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "treatment", label: "Tratamiento", type: "select", options: taxTreatmentOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "rate", label: "Tasa", type: "number", placeholder: "19.0000", description: "Usa 4 decimales maximo." },
        { name: "isWithholding", label: "Es retencion", type: "checkbox", description: "Marca si el impuesto reduce el valor a pagar o cobrar." },
      ] as const;
    case "tax-rules":
      return [
        { name: "taxId", label: "Impuesto", type: "select", options: dependencies.taxes.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })) },
        { name: "name", label: "Nombre", type: "text", placeholder: "IVA general servicios" },
        { name: "effectiveFrom", label: "Vigente desde", type: "date" },
        { name: "effectiveTo", label: "Vigente hasta", type: "date" },
        { name: "minimumBaseAmount", label: "Base minima", type: "number" },
        { name: "rateOverride", label: "Tasa override", type: "number" },
        { name: "priority", label: "Prioridad", type: "number" },
        { name: "thirdPartyType", label: "Tipo de tercero", type: "select", options: thirdPartyTypeOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "thirdPartyTaxClassification", label: "Clasificacion tributaria", type: "select", options: thirdPartyTaxClassificationOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "vatResponsibility", label: "Responsabilidad IVA", type: "select", options: vatResponsibilityOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "municipalityCode", label: "Municipio", type: "text" },
        { name: "economicActivityCode", label: "Actividad economica", type: "text" },
        { name: "fiscalTreatment", label: "Tratamiento fiscal", type: "select", options: taxTreatmentOptions.map((item) => ({ value: item.value, label: item.label })) },
        { name: "documentType", label: "Tipo documental", type: "text" },
        { name: "operationType", label: "Tipo de operacion", type: "text" },
      ] as const;
    case "cost-centers":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "CC-01" },
        { name: "name", label: "Nombre", type: "text", placeholder: "Operacion Bogota" },
        { name: "description", label: "Descripcion", type: "textarea", placeholder: "Uso operativo del centro de costo" },
      ] as const;
    case "catalog-items":
      return [
        { name: "code", label: "Codigo", type: "text", placeholder: "SRV-001" },
        { name: "name", label: "Nombre", type: "text", placeholder: "Servicio de implementacion" },
        { name: "description", label: "Descripcion", type: "textarea" },
        { name: "defaultLedgerAccountId", label: "Cuenta por defecto", type: "select", options: dependencies.ledgerAccounts.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })) },
        { name: "defaultTaxId", label: "Impuesto por defecto", type: "select", options: dependencies.taxes.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })) },
        { name: "defaultUnitPrice", label: "Precio sugerido", type: "number" },
        { name: "isActive", label: "Activo", type: "checkbox", description: "Permite sugerir este item en documentos operativos." },
      ] as const;
  }
}

export default async function AccountingCatalogRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string; catalog: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug, catalog } = await params;

  if (!allowedCatalogs.includes(catalog as AccountingCatalogKey)) {
    notFound();
  }

  const resolvedCatalog = catalog as AccountingCatalogKey;
  const rawSearchParams = await searchParams;
  const filters = catalogFiltersSchema.parse({
    q: getSingleValue(rawSearchParams.q),
    status: getSingleValue(rawSearchParams.status),
    page: getSingleValue(rawSearchParams.page),
  });

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const canManage = hasAnyOrganizationPermission(context, ["catalogs.manage", "accounting.manage"]);
  const result = await getAccountingCatalogPageData({
    organizationId: context.membership.organizationId,
    locale: organization.settings!.locale,
    currencyCode: organization.baseCurrency.code,
    catalog: resolvedCatalog,
    filters,
  });

  const rows = result.rows.map((row) => ({
    ...row,
    raw: serializeRow(resolvedCatalog, row.raw),
  }));

  return (
    <AccountingCatalogPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      catalog={resolvedCatalog}
      filters={filters}
      pagination={{
        page: filters.page,
        pageSize: 10,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / 10)),
      }}
      rows={rows}
      fields={[...getFields(resolvedCatalog, result.dependencies)]}
      canManage={canManage}
      formTitle={accountingCatalogMeta[resolvedCatalog].title}
      formDescription={accountingCatalogMeta[resolvedCatalog].description}
      saveAction={saveAccountingCatalogAction.bind(null, organizationSlug, resolvedCatalog)}
      archiveAction={
        resolvedCatalog === "tax-rules"
          ? undefined
          : archiveAccountingCatalogAction.bind(
              null,
              organizationSlug,
              resolvedCatalog as Exclude<AccountingCatalogKey, "tax-rules">,
            )
      }
    />
  );
}
