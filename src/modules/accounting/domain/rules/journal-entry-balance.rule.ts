import { DomainError } from "@/lib/errors";
import { isBalanced } from "@/lib/money/money.service";

export function assertBalancedEntry(debits: number | string, credits: number | string) {
  if (!isBalanced(debits, credits)) {
    throw new DomainError(
      "El asiento no está balanceado. La suma de débitos debe ser igual a la de créditos.",
      "UNBALANCED_JOURNAL_ENTRY",
    );
  }
}
