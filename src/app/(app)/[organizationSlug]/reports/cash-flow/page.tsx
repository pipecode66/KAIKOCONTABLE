import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getCashFlowReport } from "@/modules/reports/application/queries/get-reports-page-data";
import { rangeReportFiltersSchema } from "@/modules/reports/validators/reports.validator";
import { CashFlowPage } from "@/modules/reports/ui/pages/cash-flow-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CashFlowRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = rangeReportFiltersSchema.parse({
    from: getSingleValue(rawSearchParams.from),
    to: getSingleValue(rawSearchParams.to),
  });
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const report = await getCashFlowReport({
    organizationId: context.membership.organizationId,
    from: filters.from,
    to: filters.to,
  });

  return (
    <CashFlowPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      from={filters.from}
      to={filters.to}
      report={report}
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
