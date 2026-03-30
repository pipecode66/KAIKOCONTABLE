import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/client";

export async function assertOpenAccountingPeriod(organizationId: string, date: Date) {
  const period = await prisma.accountingPeriod.findFirst({
    where: {
      organizationId,
      periodStart: { lte: date },
      periodEnd: { gte: date },
    },
  });

  if (!period) {
    throw new DomainError("No existe un período contable configurado para esa fecha.", "MISSING_PERIOD");
  }

  if (period.status !== "OPEN") {
    throw new DomainError("El período contable está cerrado o bloqueado.", "PERIOD_LOCKED");
  }

  return period;
}
