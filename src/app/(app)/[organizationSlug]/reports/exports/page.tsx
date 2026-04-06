import { formatDateForOrganization } from "@/lib/formatting/date-format";
import { getReportExportsPageData } from "@/modules/reports/application/queries/get-reports-page-data";
import { exportsFiltersSchema } from "@/modules/reports/validators/reports.validator";
import { ReportExportsPage } from "@/modules/reports/ui/pages/report-exports-page";
import { getAuthenticatedOrganizationContext } from "@/modules/shared/application/guards/get-authenticated-organization-context";

export const dynamic = "force-dynamic";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportExportsRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationSlug } = await params;
  const rawSearchParams = await searchParams;
  const filters = exportsFiltersSchema.parse({
    page: getSingleValue(rawSearchParams.page),
  });
  const context = await getAuthenticatedOrganizationContext(organizationSlug);
  const organization = context.membership.organization;
  const settings = organization.settings!;
  const result = await getReportExportsPageData({
    organizationId: context.membership.organizationId,
    page: filters.page,
  });

  return (
    <ReportExportsPage
      organizationSlug={organizationSlug}
      organizationName={organization.name}
      filters={filters}
      pagination={{
        page: filters.page,
        pageSize: 10,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / 10)),
      }}
      rows={result.rows}
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
