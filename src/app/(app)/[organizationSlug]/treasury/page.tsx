import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getTreasuryOverview } from "@/modules/treasury/application/queries/get-treasury-page-data";
import { TreasuryOverviewPage } from "@/modules/treasury/ui/pages/treasury-overview-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function TreasuryRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;

  const overview = await getTreasuryOverview({
    organizationId: context.membership.organizationId,
    organizationSlug,
    organizationName: organization.name,
  });

  return (
    <TreasuryOverviewPage
      overview={overview}
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
