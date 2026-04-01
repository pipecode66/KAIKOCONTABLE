import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { listAccountingVouchers } from "@/modules/accounting/application/queries/list-accounting-vouchers";
import { listVoucherFormDependencies } from "@/modules/accounting/application/queries/list-voucher-form-dependencies";
import { AccountingVouchersPage } from "@/modules/accounting/ui/pages/accounting-vouchers-page";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function AccountingVouchersRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;

  const [rows, dependencies] = await Promise.all([
    listAccountingVouchers(context.membership.organizationId),
    listVoucherFormDependencies(context.membership.organizationId),
  ]);

  return (
    <AccountingVouchersPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      canManageAccounting={hasAnyOrganizationPermission(context, ["accounting.manage"])}
      canPostManualVoucher={hasAnyOrganizationPermission(context, [
        "accounting.manage",
        "accounting.manual_journal.post",
        "accounting.opening_balance.post",
      ])}
      dependencies={dependencies}
      rows={rows}
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
