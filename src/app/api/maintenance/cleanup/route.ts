import { NextResponse } from "next/server";

import { runMaintenanceCleanup } from "@/lib/maintenance/cleanup";
import { isAuthorizedInternalRequest } from "@/lib/maintenance/verify-internal-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (!isAuthorizedInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMaintenanceCleanup();

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
