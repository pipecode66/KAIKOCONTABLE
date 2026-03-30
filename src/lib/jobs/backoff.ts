export function computeBackoffDelay(attempts: number) {
  const baseDelayMs = 1_000;
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(baseDelayMs * 2 ** attempts + jitter, 60_000);
}
