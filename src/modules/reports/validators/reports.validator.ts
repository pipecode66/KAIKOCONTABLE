import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { z } from "zod";

function todayIso() {
  return formatISO(new Date(), { representation: "date" });
}

function monthStartIso() {
  return formatISO(startOfMonth(new Date()), { representation: "date" });
}

function monthEndIso() {
  return formatISO(endOfMonth(new Date()), { representation: "date" });
}

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar el formato YYYY-MM-DD.");

export const asOfReportFiltersSchema = z.object({
  asOf: isoDateString.default(todayIso()),
});

export const rangeReportFiltersSchema = z
  .object({
    from: isoDateString.default(monthStartIso()),
    to: isoDateString.default(monthEndIso()),
  })
  .refine((value) => value.from <= value.to, {
    message: "La fecha final debe ser igual o posterior a la inicial.",
    path: ["to"],
  });

export const agingReportFiltersSchema = z.object({
  asOf: isoDateString.default(todayIso()),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().default(""),
  kind: z.enum(["RECEIVABLE", "PAYABLE"]).default("RECEIVABLE"),
});

export const openDocumentsFiltersSchema = z.object({
  asOf: isoDateString.default(todayIso()),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().default(""),
});

export const exportsFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export const reportExportRequestSchema = z
  .object({
    reportKey: z.enum([
      "balance-sheet",
      "income-statement",
      "trial-balance",
      "receivables",
      "payables",
      "aging-receivables",
      "aging-payables",
      "cash-flow",
    ]),
    asOf: isoDateString.optional(),
    from: isoDateString.optional(),
    to: isoDateString.optional(),
  })
  .superRefine((value, ctx) => {
    if (["balance-sheet", "receivables", "payables", "aging-receivables", "aging-payables"].includes(value.reportKey)) {
      if (!value.asOf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["asOf"],
          message: "La fecha de corte es obligatoria para este reporte.",
        });
      }
    }

    if (["income-statement", "trial-balance", "cash-flow"].includes(value.reportKey)) {
      if (!value.from || !value.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["from"],
          message: "El rango de fechas es obligatorio para este reporte.",
        });
      }
    }

    if (value.from && value.to && value.from > value.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "La fecha final debe ser igual o posterior a la inicial.",
      });
    }
  });

export type AsOfReportFilters = z.infer<typeof asOfReportFiltersSchema>;
export type RangeReportFilters = z.infer<typeof rangeReportFiltersSchema>;
export type AgingReportFilters = z.infer<typeof agingReportFiltersSchema>;
export type OpenDocumentsFilters = z.infer<typeof openDocumentsFiltersSchema>;
export type ExportsFilters = z.infer<typeof exportsFiltersSchema>;
export type ReportExportRequestValues = z.infer<typeof reportExportRequestSchema>;
