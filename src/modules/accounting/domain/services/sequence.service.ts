import { DomainError } from "@/lib/errors";

export function formatSequenceNumber(input: {
  prefix: string;
  currentNumber: number;
  padding: number;
}) {
  if (input.currentNumber <= 0) {
    throw new DomainError("La secuencia debe avanzar con un numero positivo.", "INVALID_SEQUENCE_NUMBER");
  }

  return `${input.prefix}-${String(input.currentNumber).padStart(input.padding, "0")}`;
}

export function getFiscalYearForDate(date: Date) {
  return date.getUTCFullYear();
}
