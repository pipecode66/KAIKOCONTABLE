import { normalizeMoney } from "@/lib/money/money.service";
import type { PostingLine } from "@/modules/accounting/domain/services/posting-engine.service";

export function buildReversalLines(lines: PostingLine[]): PostingLine[] {
  return lines.map((line) => ({
    ledgerAccountId: line.ledgerAccountId,
    thirdPartyId: line.thirdPartyId ?? null,
    costCenterId: line.costCenterId ?? null,
    description: line.description ?? null,
    debit: normalizeMoney(line.credit),
    credit: normalizeMoney(line.debit),
  }));
}
