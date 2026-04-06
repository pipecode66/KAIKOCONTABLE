import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getIncomeStatementReport } from "@/modules/reports/application/queries/get-reports-page-data";
import { rangeReportFiltersSchema } from "@/modules/reports/validators/reports.validator";
import { IncomeStatementPage } from "@/modules/reports/ui/pages/income-statement-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IncomeStatementRoutePage({
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
  const report = await getIncomeStatementReport({
    organizationId: context.membership.organizationId,
    from: filters.from,
    to: filters.to,
  });

  return (
    <IncomeStatementPage
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
    />
  );
}
