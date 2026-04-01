import { z } from "zod";

import {
  LEDGER_ACCOUNT_FILTER_STATUSES,
  LEDGER_ACCOUNT_TYPES,
  type LedgerAccountFiltersInput,
} from "@/modules/accounting/dto/ledger-account.dto";

const LEDGER_ACCOUNT_TYPES_WITH_ALL = ["ALL", ...LEDGER_ACCOUNT_TYPES] as const;

export const ledgerAccountFiltersSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "La busqueda no puede superar 100 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  type: z.enum(LEDGER_ACCOUNT_TYPES_WITH_ALL).optional().default("ALL"),
  status: z.enum(LEDGER_ACCOUNT_FILTER_STATUSES).optional().default("ACTIVE"),
}) satisfies z.ZodType<LedgerAccountFiltersInput>;

export type LedgerAccountFiltersSchema = z.infer<typeof ledgerAccountFiltersSchema>;
