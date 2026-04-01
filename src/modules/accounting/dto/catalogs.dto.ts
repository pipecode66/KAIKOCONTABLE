import type {
  ThirdPartyTaxClassification,
  ThirdPartyType,
  VatResponsibility,
  TaxKind,
  TaxTreatment,
} from "@prisma/client";

export type AccountingCatalogKey =
  | "third-parties"
  | "taxes"
  | "tax-rules"
  | "cost-centers"
  | "catalog-items";

export const accountingCatalogMeta: Record<
  AccountingCatalogKey,
  { title: string; description: string }
> = {
  "third-parties": {
    title: "Terceros",
    description:
      "Base transversal para clientes, proveedores y contrapartes fiscales usada por ventas, compras, tesoreria y contabilidad.",
  },
  taxes: {
    title: "Impuestos",
    description:
      "Definiciones tributarias editables por organizacion con precision decimal y control de tratamiento fiscal.",
  },
  "tax-rules": {
    title: "Reglas tributarias",
    description:
      "Reglas Colombia parametrizables por vigencia, prioridad y perfil tributario del tercero.",
  },
  "cost-centers": {
    title: "Centros de costo",
    description:
      "Ejes de analitica operativa y asignacion de gasto que luego alimentaran reportes y asientos.",
  },
  "catalog-items": {
    title: "Items de catalogo",
    description:
      "Atajos para lineas operativas con cuenta, impuesto y precio sugerido por defecto.",
  },
};

export const thirdPartyTypeOptions: Array<{ value: ThirdPartyType; label: string }> = [
  { value: "CUSTOMER", label: "Cliente" },
  { value: "SUPPLIER", label: "Proveedor" },
  { value: "EMPLOYEE", label: "Empleado" },
  { value: "GOVERNMENT", label: "Gobierno" },
  { value: "OTHER", label: "Otro" },
];

export const thirdPartyTaxClassificationOptions: Array<{
  value: ThirdPartyTaxClassification;
  label: string;
}> = [
  { value: "RESPONSABLE_IVA", label: "Responsable IVA" },
  { value: "NO_RESPONSABLE_IVA", label: "No responsable IVA" },
  { value: "REGIMEN_SIMPLE", label: "Regimen simple" },
  { value: "GRAN_CONTRIBUYENTE", label: "Gran contribuyente" },
  { value: "AUTORRETENEDOR", label: "Autorretenedor" },
  { value: "EXENTO", label: "Exento" },
  { value: "EXCLUIDO", label: "Excluido" },
  { value: "NO_SUJETO", label: "No sujeto" },
];

export const vatResponsibilityOptions: Array<{ value: VatResponsibility; label: string }> = [
  { value: "RESPONSABLE", label: "Responsable" },
  { value: "NO_RESPONSABLE", label: "No responsable" },
];

export const taxKindOptions: Array<{ value: TaxKind; label: string }> = [
  { value: "VAT", label: "IVA" },
  { value: "WITHHOLDING_INCOME", label: "Retefuente" },
  { value: "WITHHOLDING_ICA", label: "Retencion ICA" },
  { value: "WITHHOLDING_VAT", label: "Retencion IVA" },
  { value: "OTHER", label: "Otro" },
];

export const taxTreatmentOptions: Array<{ value: TaxTreatment; label: string }> = [
  { value: "TAXABLE", label: "Gravado" },
  { value: "EXEMPT", label: "Exento" },
  { value: "EXCLUDED", label: "Excluido" },
  { value: "NON_SUBJECT", label: "No sujeto" },
];
