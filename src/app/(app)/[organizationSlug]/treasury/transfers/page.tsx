import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { voidTransferAction } from "@/modules/treasury/application/commands/treasury.commands";
import { getTransfersPageData } from "@/modules/treasury/application/queries/get-treasury-page-data";
import { TransfersPage } from "@/modules/treasury/ui/pages/transfers-page";
import { treasuryDocumentFiltersSchema } from "@/modules/treasury/validators/treasury-operations.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TreasuryTransfersRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = treasuryDocumentFiltersSchema.parse({
    q: getSingleValue(rawSearchParams.q),
    status: getSingleValue(rawSearchParams.status),
    page: getSingleValue(rawSearchParams.page),
    direction: getSingleValue(rawSearchParams.direction),
  });

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const canManage = hasAnyOrganizationPermission(context, ["treasury.manage"]);
  const result = await getTransfersPageData({
    organizationId: context.membership.organizationId,
    filters,
  });

  return (
    <TransfersPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
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
      formatMoney={(value) =>
        formatMoneyForOrganization(Number(value), {
          locale: settings.locale,
          currencyCode: organization.baseCurrency.code,
        })
      }
      onVoid={voidTransferAction.bind(null, organizationSlug)}
    />
  );
}
