export type OrganizationDateConfig = {
  locale: string;
  timezone: string;
  dateFormat: string;
};

export function formatDateForOrganization(
  value: Date | string,
  config: OrganizationDateConfig,
) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat(config.locale, {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
