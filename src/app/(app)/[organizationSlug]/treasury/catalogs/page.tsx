import { redirect } from "next/navigation";

export default async function TreasuryCatalogsIndexPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/${organizationSlug}/treasury/catalogs/payment-methods`);
}
