function escapeCsvCell(value: string) {
  const normalized = value.replaceAll('"', '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

export function serializeCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const headerLine = headers.map((header) => escapeCsvCell(header)).join(",");
  const bodyLines = rows.map((row) =>
    row
      .map((value) => escapeCsvCell(value == null ? "" : String(value)))
      .join(","),
  );

  return [headerLine, ...bodyLines].join("\n");
}

export function buildReportExportFileName(reportKey: string, suffix: string) {
  return `kaiko-${reportKey}-${suffix}.csv`;
}
