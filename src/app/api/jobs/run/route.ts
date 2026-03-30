import { NextResponse } from "next/server";

import { processPendingJobs } from "@/lib/jobs/job-runner";
import { isAuthorizedInternalRequest } from "@/lib/maintenance/verify-internal-request";
import { dispatchPendingOutbox } from "@/lib/outbox/outbox.dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (!isAuthorizedInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [processedJobs, dispatchedMessages] = await Promise.all([
    processPendingJobs(),
    dispatchPendingOutbox(),
  ]);

  return NextResponse.json({
    processedJobs: processedJobs.length,
    dispatchedMessages,
  });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
