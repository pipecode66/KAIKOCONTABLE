import { z } from "zod";

export const organizationSettingsSchema = z.object({
  timezone: z.string().min(1),
  locale: z.string().min(2),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  numberFormat: z.string().min(1),
  dateFormat: z.string().min(1),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
