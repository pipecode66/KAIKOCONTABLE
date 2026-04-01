import { voidPurchaseBillAction } from "@/modules/purchases/application/commands/purchase-bill.commands";
import { getPurchaseBillsPageData } from "@/modules/purchases/application/queries/get-purchase-bills-page-data";
import { PurchaseBillsPage } from "@/modules/purchases/ui/pages/purchase-bills-page";
import { documentFiltersSchema } from "@/modules/shared/validators/document-filters.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PurchaseBillsRoutePage({
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
  const canManage = hasAnyOrganizationPermission(context, ["purchases.manage"]);
  const result = await getPurchaseBillsPageData({
    organizationId: context.membership.organizationId,
    filters,
  });

  return (
    <PurchaseBillsPage
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
      onVoid={voidPurchaseBillAction.bind(null, organizationSlug)}
    />
  );
}
