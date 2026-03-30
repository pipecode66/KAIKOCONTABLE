export type JobPayload = Record<string, unknown>;

export type EnqueueJobInput = {
  type: string;
  payload: JobPayload;
  organizationId?: string;
  correlationId?: string;
  dedupeKey?: string;
};
