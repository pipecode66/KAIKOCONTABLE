import { PurchasesOverviewPage } from "@/modules/purchases/ui/pages/purchases-overview-page";

export default async function PurchasesRoutePage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  return <PurchasesOverviewPage organizationSlug={organizationSlug} />;
}
