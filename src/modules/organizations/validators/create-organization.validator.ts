import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  slug: z
    .string()
    .trim()
    .min(2, "El slug debe tener al menos 2 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Usa solo letras minusculas, numeros y guiones."),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  taxId: z.string().trim().max(60).optional().or(z.literal("")),
  baseCurrencyId: z.string().trim().min(1, "Selecciona una moneda base."),
  timezone: z.string().trim().min(1, "Selecciona una zona horaria."),
  locale: z.string().trim().min(2, "Selecciona un locale."),
  fiscalYearStartMonth: z.coerce
    .number()
    .int("El mes fiscal debe ser entero.")
    .min(1, "El mes fiscal debe estar entre 1 y 12.")
    .max(12, "El mes fiscal debe estar entre 1 y 12."),
  numberFormat: z.string().trim().min(1, "Define el formato numerico."),
  dateFormat: z.string().trim().min(1, "Define el formato de fecha."),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
