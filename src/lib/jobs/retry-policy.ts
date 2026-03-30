import { addMilliseconds } from "date-fns";

import { computeBackoffDelay } from "@/lib/jobs/backoff";

export function nextAttemptDate(attempts: number) {
  return addMilliseconds(new Date(), computeBackoffDelay(attempts));
}
