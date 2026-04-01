import { z } from "zod";

const decimalPattern = /^-?\d+(?:[.,]\d{1,2})?$/;

const voucherLineSchema = z
  .object({
    id: z.string().optional(),
    ledgerAccountId: z.string().min(1, "Selecciona una cuenta contable."),
    thirdPartyId: z.string().optional(),
    costCenterId: z.string().optional(),
    description: z.string().max(240, "La descripcion debe tener maximo 240 caracteres.").optional(),
    debit: z.string().trim().default("0"),
    credit: z.string().trim().default("0"),
  })
  .superRefine((value, ctx) => {
    if (!decimalPattern.test(value.debit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debito invalido.",
        path: ["debit"],
      });
    }

    if (!decimalPattern.test(value.credit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credito invalido.",
        path: ["credit"],
      });
    }

    const debit = Number(value.debit.replace(",", "."));
    const credit = Number(value.credit.replace(",", "."));

    if ((debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada linea debe tener debito o credito, pero no ambos.",
        path: ["debit"],
      });
    }
  });

export const manualVoucherFormSchema = z
  .object({
    id: z.string().optional(),
    version: z.coerce.number().int().positive().optional(),
    voucherType: z.enum(["MANUAL_ADJUSTMENT", "OPENING_BALANCE", "PERIOD_CLOSING"]),
    entryDate: z.string().min(1, "Debes indicar la fecha del asiento."),
    description: z.string().trim().min(6, "Describe el ajuste contable.").max(280),
    lines: z.array(voucherLineSchema).min(2, "Agrega al menos dos lineas."),
  })
  .superRefine((value, ctx) => {
    const activeLines = value.lines.filter((line) => line.ledgerAccountId);

    if (activeLines.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agrega al menos dos lineas validas.",
        path: ["lines"],
      });
    }
  });

export const voucherVoidSchema = z.object({
  voucherId: z.string().min(1),
  version: z.coerce.number().int().positive(),
  reason: z.string().trim().min(6, "Indica el motivo de anulacion.").max(280),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export type ManualVoucherFormValues = z.output<typeof manualVoucherFormSchema>;
export type VoucherVoidValues = z.infer<typeof voucherVoidSchema>;
