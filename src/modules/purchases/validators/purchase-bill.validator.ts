import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(?:[.,]\d{1,4})?$/, "El valor decimal es invalido.");

export const purchaseBillLineSchema = z.object({
  itemId: z.string().optional().or(z.literal("")),
  accountId: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  description: z.string().trim().min(3, "Describe la linea.").max(200),
  quantity: decimalString,
  unitPrice: decimalString,
});

export const purchaseBillFormSchema = z.object({
  id: z.string().optional(),
  version: z.number().int().positive().optional(),
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  issueDate: z.string().min(1, "Define la fecha del documento."),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  lines: z.array(purchaseBillLineSchema).min(1, "Agrega al menos una linea."),
});

export const purchaseBillVoidSchema = z.object({
  billId: z.string().min(1),
  reason: z.string().trim().min(6).max(400),
  idempotencyKey: z.string().trim().min(6).max(200),
});

export type PurchaseBillFormValues = z.infer<typeof purchaseBillFormSchema>;
export type PurchaseBillVoidValues = z.infer<typeof purchaseBillVoidSchema>;
