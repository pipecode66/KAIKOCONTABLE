type OutboxPayload = Record<string, unknown>;

export type OutboxDispatchTarget =
  | {
      kind: "job";
      type: string;
      payload: OutboxPayload;
      dedupeKey: string;
    }
  | {
      kind: "event";
    };

const JOB_EVENT_MAP: Record<string, string> = {
  "treasury.statement_import.requested": "treasury.statement_import.process",
  "reports.export": "reports.export",
};

export function translateOutboxMessage(input: {
  eventType: string;
  payload: OutboxPayload;
  dedupeKey: string;
}): OutboxDispatchTarget {
  const mappedType = JOB_EVENT_MAP[input.eventType];
  if (!mappedType) {
    return { kind: "event" };
  }

  return {
    kind: "job",
    type: mappedType,
    payload: {
      ...input.payload,
      dispatchedFromOutbox: true,
      sourceEventType: input.eventType,
    },
    dedupeKey: `outbox:${input.dedupeKey}`,
  };
}
