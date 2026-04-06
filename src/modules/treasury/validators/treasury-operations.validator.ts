import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(?:[.,]\d{1,4})?$/, "El valor decimal es invalido.");

export const treasuryDocumentFiltersSchema = z.object({
  q: z.string().trim().default(""),
  status: z.enum(["ALL", "DRAFT", "POSTED", "VOIDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  direction: z.enum(["ALL", "RECEIVED", "SENT"]).default("ALL"),
});

export const statementImportFiltersSchema = z.object({
  status: z.enum(["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
});

export const reconciliationFiltersSchema = z.object({
  status: z.enum(["ALL", "DRAFT", "IN_PROGRESS", "COMPLETED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
});

export const paymentAllocationSchema = z
  .object({
    documentType: z.enum(["SALES_INVOICE", "PURCHASE_BILL", "EXPENSE"]),
    documentId: z.string().min(1, "Selecciona el documento a aplicar."),
    amount: decimalString,
  })
  .refine((value) => Number(value.amount.replace(",", ".")) > 0, {
    message: "El monto aplicado debe ser mayor a cero.",
    path: ["amount"],
  });

export const paymentFormSchema = z
  .object({
    id: z.string().optional(),
    version: z.number().int().positive().optional(),
    thirdPartyId: z.string().optional().or(z.literal("")),
    methodId: z.string().min(1, "Selecciona el metodo de pago."),
    bankAccountId: z.string().optional().or(z.literal("")),
    cashAccountId: z.string().optional().or(z.literal("")),
    direction: z.enum(["RECEIVED", "SENT"]),
    paymentDate: z.string().min(1, "Define la fecha del pago."),
    amount: decimalString,
    reference: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    allocations: z.array(paymentAllocationSchema).min(1, "Agrega al menos una aplicacion."),
  })
  .superRefine((value, ctx) => {
    const hasBank = Boolean(value.bankAccountId);
    const hasCash = Boolean(value.cashAccountId);

    if (hasBank === hasCash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankAccountId"],
        message: "Selecciona exactamente una cuenta origen/destino de tesoreria.",
      });
    }
  });

export const transferFormSchema = z
  .object({
    id: z.string().optional(),
    version: z.number().int().positive().optional(),
    sourceBankAccountId: z.string().optional().or(z.literal("")),
    sourceCashAccountId: z.string().optional().or(z.literal("")),
    destinationBankAccountId: z.string().optional().or(z.literal("")),
    destinationCashAccountId: z.string().optional().or(z.literal("")),
    transferDate: z.string().min(1, "Define la fecha del traslado."),
    amount: decimalString,
    reference: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const sourceOptions = [value.sourceBankAccountId, value.sourceCashAccountId].filter(Boolean);
    const destinationOptions = [
      value.destinationBankAccountId,
      value.destinationCashAccountId,
    ].filter(Boolean);

    if (sourceOptions.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceBankAccountId"],
        message: "Selecciona exactamente una cuenta origen.",
      });
    }

    if (destinationOptions.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationBankAccountId"],
        message: "Selecciona exactamente una cuenta destino.",
      });
    }

    if (sourceOptions.length === 1 && destinationOptions.length === 1 && sourceOptions[0] === destinationOptions[0]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationBankAccountId"],
        message: "El origen y el destino deben ser distintos.",
      });
    }
  });

export const treasuryVoidSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().min(6).max(400),
  idempotencyKey: z.string().trim().min(6).max(200),
});

export const statementImportSchema = z.object({
  bankAccountId: z.string().min(1, "Selecciona la cuenta bancaria."),
  fileName: z.string().trim().min(3).max(200),
  csvContent: z.string().trim().min(10, "El CSV del extracto no puede venir vacio."),
});

export const reconciliationCreateSchema = z
  .object({
    bankAccountId: z.string().min(1, "Selecciona la cuenta bancaria."),
    periodStart: z.string().min(1, "Define la fecha inicial."),
    periodEnd: z.string().min(1, "Define la fecha final."),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((value) => new Date(value.periodStart) <= new Date(value.periodEnd), {
    message: "La fecha final debe ser posterior a la inicial.",
    path: ["periodEnd"],
  });

export const reconciliationCompleteSchema = z.object({
  reconciliationId: z.string().min(1),
  selections: z
    .array(
      z.object({
        bankStatementLineId: z.string().min(1),
        matchedDocumentType: z.enum(["PAYMENT", "TRANSFER"]),
        matchedDocumentId: z.string().min(1),
        matchedAmount: decimalString,
        notes: z.string().trim().max(300).optional().or(z.literal("")),
      }),
    )
    .min(1, "Selecciona al menos una coincidencia sugerida."),
});

export type TreasuryDocumentFilterValues = z.infer<typeof treasuryDocumentFiltersSchema>;
export type StatementImportFilterValues = z.infer<typeof statementImportFiltersSchema>;
export type ReconciliationFilterValues = z.infer<typeof reconciliationFiltersSchema>;
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
export type TransferFormValues = z.infer<typeof transferFormSchema>;
export type TreasuryVoidValues = z.infer<typeof treasuryVoidSchema>;
export type StatementImportValues = z.infer<typeof statementImportSchema>;
export type ReconciliationCreateValues = z.infer<typeof reconciliationCreateSchema>;
export type ReconciliationCompleteValues = z.infer<typeof reconciliationCompleteSchema>;
