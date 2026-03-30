import { addDays } from "date-fns";

import { prisma } from "@/lib/prisma/client";

export async function processPendingJobs(limit = 25) {
  const jobs = await prisma.asyncJob.findMany({
    where: {
      status: {
        in: ["PENDING", "RETRYING"],
      },
      availableAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  return Promise.all(
    jobs.map((job) =>
      prisma.asyncJob.update({
        where: { id: job.id },
        data: {
          status: "ARCHIVED",
          archivedAt: addDays(new Date(), 90),
        },
      }),
    ),
  );
}
