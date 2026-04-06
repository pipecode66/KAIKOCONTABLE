import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getPayablesReport } from "@/modules/reports/application/queries/get-reports-page-data";
import { openDocumentsFiltersSchema } from "@/modules/reports/validators/reports.validator";
import { PayablesPage } from "@/modules/reports/ui/pages/payables-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PayablesRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = openDocumentsFiltersSchema.parse({
    asOf: getSingleValue(rawSearchParams.asOf),
    page: getSingleValue(rawSearchParams.page),
    q: getSingleValue(rawSearchParams.q),
  });
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const result = await getPayablesReport({
    organizationId: context.membership.organizationId,
    asOf: filters.asOf,
    page: filters.page,
    q: filters.q,
  });

  return (
    <PayablesPage
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
