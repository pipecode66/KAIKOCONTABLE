import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getBalanceSheetReport } from "@/modules/reports/application/queries/get-reports-page-data";
import { asOfReportFiltersSchema } from "@/modules/reports/validators/reports.validator";
import { BalanceSheetPage } from "@/modules/reports/ui/pages/balance-sheet-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BalanceSheetRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const filters = asOfReportFiltersSchema.parse({
    asOf: getSingleValue((await searchParams).asOf),
  });
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const report = await getBalanceSheetReport({
    organizationId: context.membership.organizationId,
    asOf: filters.asOf,
  });

  return (
    <BalanceSheetPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      asOf={filters.asOf}
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
