import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getDashboardOverview } from "@/modules/reports/application/queries/get-dashboard-overview";
import { DashboardPage } from "@/modules/reports/ui/pages/dashboard-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function DashboardRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const overview = await getDashboardOverview({
    organizationId: context.membership.organizationId,
    organizationSlug,
    organizationName: organization.name,
  });

  return (
    <DashboardPage
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
