import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await prisma.asyncJob.findFirst({
    where: {
      id: jobId,
      type: "reports.export",
      organization: {
        memberships: {
          some: {
            userId: session.user.id,
            isActive: true,
            status: "ACTIVE",
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    code: "reports.read",
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = job.payload as Record<string, unknown>;
  const csvContent = typeof payload.csvContent === "string" ? payload.csvContent : null;
  const fileName = typeof payload.fileName === "string" ? payload.fileName : "kaiko-report.csv";
  if (!csvContent || job.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Export not ready" }, { status: 409 });
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
