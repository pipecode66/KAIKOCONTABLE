import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import { listJournalEntries } from "@/modules/accounting/application/queries/list-journal-entries";
import { JournalEntriesPage } from "@/modules/accounting/ui/pages/journal-entries-page";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

export default async function JournalEntriesRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const rows = await listJournalEntries(context.membership.organizationId);

  return (
    <JournalEntriesPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      canManageAccounting={hasAnyOrganizationPermission(context, ["accounting.manage"])}
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
