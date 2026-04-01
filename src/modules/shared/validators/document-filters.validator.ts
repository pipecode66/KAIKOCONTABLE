import { z } from "zod";

export const documentFiltersSchema = z.object({
  q: z.string().trim().default(""),
  status: z.enum(["ALL", "DRAFT", "POSTED", "VOIDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
});
