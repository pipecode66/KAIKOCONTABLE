import { redirect } from "next/navigation";

export default async function AccountingCatalogsIndexPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  redirect(`/${organizationSlug}/accounting/catalogs/third-parties`);
}
