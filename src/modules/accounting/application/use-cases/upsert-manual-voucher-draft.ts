import { Prisma } from "@prisma/client";

import { assertVersion } from "@/lib/concurrency/guard";
import { DomainError, NotFoundError } from "@/lib/errors";
import { normalizeMoney, sumMoney } from "@/lib/money/money.service";
import { writeAuditLog } from "@/modules/audit/application/use-cases/write-audit-log";
import { assertBalancedEntry } from "@/modules/accounting/domain/rules/journal-entry-balance.rule";
import { assertPeriodIsOpen } from "@/modules/accounting/domain/services/accounting-period.service";
import { accountingCoreRepository } from "@/modules/accounting/infrastructure/repositories/accounting-core.repository";
import type { ManualVoucherFormValues } from "@/modules/accounting/validators/manual-voucher-form.validator";
import { parseAccountingDate } from "@/modules/accounting/application/use-cases/accounting-date";
import { prisma } from "@/lib/prisma/client";

type UpsertManualVoucherDraftInput = {
  organizationId: string;
  actorUserId: string;
  correlationId: string;
  data: ManualVoucherFormValues;
};

export async function upsertManualVoucherDraft(input: UpsertManualVoucherDraftInput) {
  const organization = await accountingCoreRepository.getOrganizationContext(input.organizationId);
  const entryDate = parseAccountingDate(input.data.entryDate);
  const period = await accountingCoreRepository.resolvePeriodByDate({
    organizationId: input.organizationId,
    date: entryDate,
  });

  if (!period) {
    throw new DomainError("No existe un periodo contable configurado para la fecha indicada.", "MISSING_PERIOD");
  }

  assertPeriodIsOpen(period);

  const debitTotal = sumMoney(input.data.lines.map((line) => line.debit.replace(",", ".")));
  const creditTotal = sumMoney(input.data.lines.map((line) => line.credit.replace(",", ".")));
  assertBalancedEntry(debitTotal.toString(), creditTotal.toString());

  if (input.data.id) {
    const current = await accountingCoreRepository.findVoucherById({
      organizationId: input.organizationId,
      voucherId: input.data.id,
    });

    if (!current) {
      throw new NotFoundError("No encontramos el voucher que intentas editar.");
    }

    if (current.status !== "DRAFT") {
      throw new DomainError("Los vouchers ya publicados o anulados no se pueden editar.", "VOUCHER_IMMUTABLE");
    }

    if (input.data.version !== undefined) {
      assertVersion(current.version, input.data.version);
    }
  }

  const lines = input.data.lines.map((line) => ({
    ledgerAccountId: line.ledgerAccountId,
    thirdPartyId: line.thirdPartyId || null,
    costCenterId: line.costCenterId || null,
    description: line.description?.trim() || null,
    debit: new Prisma.Decimal(normalizeMoney(line.debit.replace(",", ".")).toString()),
    credit: new Prisma.Decimal(normalizeMoney(line.credit.replace(",", ".")).toString()),
  }));

  return prisma.$transaction(async (tx) => {
    const voucher = await accountingCoreRepository.saveVoucherDraft(
      {
        organizationId: input.organizationId,
        currencyId: organization.baseCurrencyId,
        accountingPeriodId: period.id,
        voucherType: input.data.voucherType,
        description: input.data.description.trim(),
        entryDate,
        debitTotal: new Prisma.Decimal(debitTotal.toString()),
        creditTotal: new Prisma.Decimal(creditTotal.toString()),
        lines,
        voucherId: input.data.id,
        expectedVersion: input.data.version,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.data.id ? "UPDATED" : "CREATED",
        entityType: "AccountingVoucher",
        entityId: voucher.id,
        correlationId: input.correlationId,
        afterState: {
          status: voucher.status,
          voucherType: voucher.voucherType,
          debitTotal: voucher.debitTotal.toString(),
          creditTotal: voucher.creditTotal.toString(),
        },
      },
      tx,
    );

    return voucher;
  });
}
