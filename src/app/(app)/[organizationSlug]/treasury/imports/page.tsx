import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getStatementImportsPageData } from "@/modules/treasury/application/queries/get-treasury-page-data";
import { StatementImportsPage } from "@/modules/treasury/ui/pages/statement-imports-page";
import { statementImportFiltersSchema } from "@/modules/treasury/validators/treasury-operations.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TreasuryImportsRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = statementImportFiltersSchema.parse({
    status: getSingleValue(rawSearchParams.status),
    page: getSingleValue(rawSearchParams.page),
  });

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const canManage = hasAnyOrganizationPermission(context, ["treasury.manage"]);
  const result = await getStatementImportsPageData({
    organizationId: context.membership.organizationId,
    filters,
  });

  return (
    <StatementImportsPage
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
      dependencies={result.dependencies}
      canManage={canManage}
      formatMoney={(value) =>
        formatMoneyForOrganization(Number(value), {
          locale: settings.locale,
          currencyCode: organization.baseCurrency.code,
        })
      }
      formatDate={(value) =>
        formatDateForOrganization(value, {
          locale: settings.locale,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
        })
      }
    />
  );
}
