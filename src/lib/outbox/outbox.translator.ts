type OutboxPayload = Record<string, unknown>;

export function outboxMessageToJobPayload(payload: OutboxPayload) {
  return {
    ...payload,
    dispatchedFromOutbox: true,
  };
}
