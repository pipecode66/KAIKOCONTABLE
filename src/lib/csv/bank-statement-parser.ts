import { parse } from "csv-parse/sync";

export type ParsedBankStatementRow = {
  transactionDate: string;
  description: string;
  amount: string;
  reference?: string;
  balance?: string;
};

export function parseBankStatementCsv(content: string) {
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ParsedBankStatementRow[];

  return rows;
}
