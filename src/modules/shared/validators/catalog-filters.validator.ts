import { z } from "zod";

export const catalogFiltersSchema = z.object({
  q: z.string().trim().optional().default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED", "INACTIVE"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type CatalogFiltersInput = z.infer<typeof catalogFiltersSchema>;
