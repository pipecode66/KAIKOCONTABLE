import { randomUUID } from "node:crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function createCorrelationId() {
  return randomUUID();
}

export function resolveCorrelationId(
  incoming?: Headers | Record<string, string | undefined>,
) {
  if (!incoming) {
    return createCorrelationId();
  }

  if (incoming instanceof Headers) {
    return incoming.get(CORRELATION_ID_HEADER) ?? createCorrelationId();
  }

  return incoming[CORRELATION_ID_HEADER] ?? createCorrelationId();
}
