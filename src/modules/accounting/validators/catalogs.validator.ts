import { z } from "zod";

import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(?:[.,]\d{1,4})?$/, "El valor decimal es invalido.");

export const thirdPartyFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  taxId: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Correo invalido.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  municipalityCode: z.string().trim().max(20).optional().or(z.literal("")),
  economicActivityCode: z.string().trim().max(20).optional().or(z.literal("")),
  type: z.enum(["CUSTOMER", "SUPPLIER", "EMPLOYEE", "GOVERNMENT", "OTHER"]),
  taxClassification: z
    .enum([
      "RESPONSABLE_IVA",
      "NO_RESPONSABLE_IVA",
      "REGIMEN_SIMPLE",
      "GRAN_CONTRIBUYENTE",
      "AUTORRETENEDOR",
      "EXENTO",
      "EXCLUIDO",
      "NO_SUJETO",
    ])
    .optional()
    .or(z.literal("")),
  vatResponsibility: z.enum(["RESPONSABLE", "NO_RESPONSABLE"]).optional().or(z.literal("")),
  isWithholdingAgent: z.boolean().default(false),
});

export const taxFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["VAT", "WITHHOLDING_INCOME", "WITHHOLDING_ICA", "WITHHOLDING_VAT", "OTHER"]),
  treatment: z.enum(["TAXABLE", "EXEMPT", "EXCLUDED", "NON_SUBJECT"]),
  rate: decimalString,
  isWithholding: z.boolean().default(false),
});

export const taxRuleFormSchema = z.object({
  id: z.string().optional(),
  taxId: z.string().min(1),
  name: z.string().trim().min(4).max(160),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().optional().or(z.literal("")),
  minimumBaseAmount: decimalString.optional().or(z.literal("")),
  rateOverride: decimalString.optional().or(z.literal("")),
  priority: z.coerce.number().int().min(1).max(9999),
  thirdPartyType: z.enum(["CUSTOMER", "SUPPLIER", "EMPLOYEE", "GOVERNMENT", "OTHER"]).optional().or(z.literal("")),
  thirdPartyTaxClassification: z
    .enum([
      "RESPONSABLE_IVA",
      "NO_RESPONSABLE_IVA",
      "REGIMEN_SIMPLE",
      "GRAN_CONTRIBUYENTE",
      "AUTORRETENEDOR",
      "EXENTO",
      "EXCLUIDO",
      "NO_SUJETO",
    ])
    .optional()
    .or(z.literal("")),
  vatResponsibility: z.enum(["RESPONSABLE", "NO_RESPONSABLE"]).optional().or(z.literal("")),
  municipalityCode: z.string().trim().max(20).optional().or(z.literal("")),
  economicActivityCode: z.string().trim().max(20).optional().or(z.literal("")),
  fiscalTreatment: z.enum(["TAXABLE", "EXEMPT", "EXCLUDED", "NON_SUBJECT"]).optional().or(z.literal("")),
  documentType: z.string().trim().max(40).optional().or(z.literal("")),
  operationType: z.string().trim().max(40).optional().or(z.literal("")),
});

export const costCenterFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(240).optional().or(z.literal("")),
});

export const catalogItemFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  defaultLedgerAccountId: z.string().optional().or(z.literal("")),
  defaultTaxId: z.string().optional().or(z.literal("")),
  defaultUnitPrice: decimalString,
  isActive: z.boolean().default(true),
});

export const accountingCatalogSchemas: Record<AccountingCatalogKey, z.ZodTypeAny> = {
  "third-parties": thirdPartyFormSchema,
  taxes: taxFormSchema,
  "tax-rules": taxRuleFormSchema,
  "cost-centers": costCenterFormSchema,
  "catalog-items": catalogItemFormSchema,
};
