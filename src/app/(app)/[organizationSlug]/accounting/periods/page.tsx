import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { listAccountingPeriods } from "@/modules/accounting/application/queries/list-accounting-periods";
import { AccountingPeriodsPage } from "@/modules/accounting/ui/pages/accounting-periods-page";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodsRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const settings = context.membership.organization.settings!;
  const rows = await listAccountingPeriods(context.membership.organizationId);

  return (
    <AccountingPeriodsPage
      organizationSlug={organizationSlug}
      organizationName={context.membership.organization.name}
      canManagePeriods={hasAnyOrganizationPermission(context, [
        "accounting.manage",
        "accounting.period.close",
        "accounting.period.reopen",
        "accounting.period.lock",
      ])}
      rows={rows}
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
