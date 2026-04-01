import { AccountingOverviewPage } from "@/modules/accounting/ui/pages/accounting-overview-page";
import { listLedgerAccountParentOptions } from "@/modules/accounting/application/queries/list-ledger-account-parent-options";
import { listLedgerAccounts } from "@/modules/accounting/application/queries/list-ledger-accounts";
import { ledgerAccountFiltersSchema } from "@/modules/accounting/validators/ledger-account-filters.validator";
import {
  getAuthenticatedOrganizationContext,
  hasAnyOrganizationPermission,
} from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LedgerAccountsRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;

  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const canManage = hasAnyOrganizationPermission(context, ["catalogs.manage", "accounting.manage"]);
  const filters = ledgerAccountFiltersSchema.parse({
    q: getSingleValue(rawSearchParams.q),
    type: getSingleValue(rawSearchParams.type),
    status: getSingleValue(rawSearchParams.status),
  });

  const [catalog, parentOptions] = canManage
    ? await Promise.all([
        listLedgerAccounts({
          organizationId: context.membership.organizationId,
          filters,
        }),
        listLedgerAccountParentOptions({
          organizationId: context.membership.organizationId,
        }),
      ])
    : [
        {
          filters: {
            q: filters.q,
            type: filters.type,
            status: filters.status,
          },
          summary: {
            totalActive: 0,
            totalArchived: 0,
            totalPosting: 0,
            totalManual: 0,
          },
          rows: [],
        },
        [],
      ];

  return (
    <AccountingOverviewPage
      organizationSlug={organizationSlug}
      catalog={catalog}
      parentOptions={parentOptions}
      canManage={canManage}
    />
  );
}
