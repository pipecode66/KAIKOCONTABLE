import { z } from "zod";

export const journalReversalSchema = z.object({
  journalEntryId: z.string().min(1),
  reason: z.string().trim().min(6, "Indica el motivo de la reversion.").max(280),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export type JournalReversalInput = z.infer<typeof journalReversalSchema>;
