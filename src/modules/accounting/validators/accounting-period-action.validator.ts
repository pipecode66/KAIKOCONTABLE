import { z } from "zod";

export const accountingPeriodActionSchema = z.object({
  periodId: z.string().min(1),
  reason: z.string().trim().max(280).optional(),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export type AccountingPeriodActionInput = z.infer<typeof accountingPeriodActionSchema>;
