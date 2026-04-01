import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { getAccountingCoreOverview } from "@/modules/accounting/application/queries/get-accounting-core-overview";
import { AccountingCorePage } from "@/modules/accounting/ui/pages/accounting-core-page";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function AccountingRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const canManageAccounting = hasAnyOrganizationPermission(context, ["accounting.manage"]);
  const canPostManualVoucher = hasAnyOrganizationPermission(context, [
    "accounting.manage",
    "accounting.manual_journal.post",
    "accounting.opening_balance.post",
  ]);
  const canManagePeriods = hasAnyOrganizationPermission(context, [
    "accounting.manage",
    "accounting.period.close",
    "accounting.period.reopen",
    "accounting.period.lock",
  ]);

  const overview = await getAccountingCoreOverview({
    organizationId: organization.id,
    organizationSlug,
    organizationName: organization.name,
    canManageAccounting,
    canPostManualVoucher,
    canManagePeriods,
  });

  return (
    <AccountingCorePage
      overview={overview}
      formatDate={(value) =>
        formatDateForOrganization(value, {
          locale: settings.locale,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
        })
      }
      formatMoney={(value) =>
        formatMoneyForOrganization(Number(value), {
          locale: settings.locale,
          currencyCode: organization.baseCurrency.code,
        })
      }
    />
  );
}
