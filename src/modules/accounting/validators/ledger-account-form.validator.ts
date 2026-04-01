import { z } from "zod";

import {
  LEDGER_ACCOUNT_TYPES,
  NORMAL_BALANCES,
  type LedgerAccountFormInput,
} from "@/modules/accounting/dto/ledger-account.dto";

export const ledgerAccountFormSchema = z.object({
  id: z.string().cuid().optional(),
  code: z
    .string()
    .trim()
    .min(2, "El codigo debe tener al menos 2 caracteres.")
    .max(20, "El codigo no puede superar 20 caracteres.")
    .regex(/^[A-Z0-9._-]+$/, "Usa solo letras mayusculas, numeros, punto, guion o guion bajo."),
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  description: z.string().trim().max(500, "La descripcion no puede superar 500 caracteres.").optional(),
  type: z.enum(LEDGER_ACCOUNT_TYPES),
  normalBalance: z.enum(NORMAL_BALANCES),
  parentId: z.string().cuid().optional(),
  isPosting: z.boolean(),
  allowManualEntries: z.boolean(),
}) satisfies z.ZodType<LedgerAccountFormInput>;

export type LedgerAccountFormSchema = z.infer<typeof ledgerAccountFormSchema>;
