import { getSalesInvoicesPageData } from "@/modules/sales/application/queries/get-sales-invoices-page-data";
import { voidSalesInvoiceAction } from "@/modules/sales/application/commands/sales-invoice.commands";
import { SalesInvoicesPage } from "@/modules/sales/ui/pages/sales-invoices-page";
import { documentFiltersSchema } from "@/modules/shared/validators/document-filters.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SalesInvoicesRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = documentFiltersSchema.parse({
    q: getSingleValue(rawSearchParams.q),
    status: getSingleValue(rawSearchParams.status),
    page: getSingleValue(rawSearchParams.page),
  });

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const canManage = hasAnyOrganizationPermission(context, ["sales.manage"]);
  const result = await getSalesInvoicesPageData({
    organizationId: context.membership.organizationId,
    filters,
  });

  return (
    <SalesInvoicesPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      locale={organization.settings!.locale}
      currencyCode={organization.baseCurrency.code}
      filters={filters}
      pagination={{
        page: filters.page,
        pageSize: 10,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / 10)),
      }}
      rows={result.rows}
      editors={result.editors}
      dependencies={result.dependencies}
      canManage={canManage}
      onVoid={voidSalesInvoiceAction.bind(null, organizationSlug)}
    />
  );
}
