import { SalesOverviewPage } from "@/modules/sales/ui/pages/sales-overview-page";

export default async function SalesRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  return <SalesOverviewPage organizationSlug={organizationSlug} />;
}
