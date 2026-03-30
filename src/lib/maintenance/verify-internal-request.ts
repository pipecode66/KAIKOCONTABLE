import { env } from "@/lib/env/server";

export function isAuthorizedInternalRequest(request: Request) {
  const internalToken = request.headers.get("x-internal-token");

  if (internalToken && internalToken === env.INTERNAL_CRON_TOKEN) {
    return true;
  }

  const authorization = request.headers.get("authorization");

  if (env.CRON_SECRET && authorization === `Bearer ${env.CRON_SECRET}`) {
    return true;
  }

  return false;
}
