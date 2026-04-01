import { z } from "zod";

import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";

export const paymentMethodFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(240).optional().or(z.literal("")),
});

export const bankAccountFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  bankName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(4).max(60),
  accountType: z.string().trim().min(2).max(40),
});

export const cashAccountFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().max(160).optional().or(z.literal("")),
});

export const treasuryCatalogSchemas: Record<TreasuryCatalogKey, z.ZodTypeAny> = {
  "payment-methods": paymentMethodFormSchema,
  "bank-accounts": bankAccountFormSchema,
  "cash-accounts": cashAccountFormSchema,
};
