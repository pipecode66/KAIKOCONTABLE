import { DomainError } from "@/lib/errors";

export function parseAccountingDate(value: string) {
  const parts = value.split("-").map((segment) => Number(segment));

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    throw new DomainError("La fecha contable es invalida.", "INVALID_ACCOUNTING_DATE");
  }

  const [year, month, day] = parts;

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}
