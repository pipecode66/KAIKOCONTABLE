import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getReportsOverview } from "@/modules/reports/application/queries/get-reports-page-data";
import { ReportsOverviewPage } from "@/modules/reports/ui/pages/reports-overview-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function ReportsRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const overview = await getReportsOverview({
    organizationId: context.membership.organizationId,
  });

  return (
    <ReportsOverviewPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      overview={overview}
      formatMoney={(value) =>
        formatMoneyForOrganization(Number(value), {
          locale: settings.locale,
          currencyCode: organization.baseCurrency.code,
        })
      }
    />
  );
}
