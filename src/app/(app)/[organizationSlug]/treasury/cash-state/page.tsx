import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getCashStatePageData } from "@/modules/treasury/application/queries/get-treasury-page-data";
import { CashStatePage } from "@/modules/treasury/ui/pages/cash-state-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function TreasuryCashStateRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const snapshot = await getCashStatePageData(context.membership.organizationId);

  return (
    <CashStatePage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      snapshot={snapshot}
      formatMoney={(value) =>
        formatMoneyForOrganization(Number(value), {
          locale: settings.locale,
          currencyCode: organization.baseCurrency.code,
        })
      }
    />
  );
}
