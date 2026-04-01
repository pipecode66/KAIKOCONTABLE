import type { AccountingPeriod, AccountingPeriodStatus } from "@prisma/client";

import { DomainError } from "@/lib/errors";

export function assertPeriodIsOpen(period: Pick<AccountingPeriod, "status">) {
  if (period.status !== "OPEN") {
    throw new DomainError("El periodo contable esta cerrado o bloqueado.", "PERIOD_LOCKED");
  }
}

export function assertPeriodCanClose(status: AccountingPeriodStatus) {
  if (status !== "OPEN") {
    throw new DomainError("Solo los periodos abiertos se pueden cerrar.", "PERIOD_NOT_OPEN");
  }
}

export function assertPeriodCanLock(status: AccountingPeriodStatus) {
  if (status === "LOCKED") {
    throw new DomainError("El periodo ya esta bloqueado.", "PERIOD_ALREADY_LOCKED");
  }
}

export function assertPeriodCanReopen(status: AccountingPeriodStatus) {
  if (status === "OPEN") {
    throw new DomainError("El periodo ya esta abierto.", "PERIOD_ALREADY_OPEN");
  }
}

export function getAccountingPeriodLabel(period: Pick<AccountingPeriod, "fiscalYear" | "periodNumber">) {
  return `P${String(period.periodNumber).padStart(2, "0")} / ${period.fiscalYear}`;
}
