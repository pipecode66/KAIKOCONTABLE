export type OrganizationNumberConfig = {
  locale: string;
  currencyCode: string;
};

export function formatMoneyForOrganization(
  value: number,
  config: OrganizationNumberConfig,
) {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}
