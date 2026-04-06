import type {
  PaymentEditorDto,
  PaymentFormDependenciesDto,
  PaymentListItemDto,
  ReconciliationListItemDto,
  StatementImportDependenciesDto,
  StatementImportListItemDto,
  TransferEditorDto,
  TransferFormDependenciesDto,
  TransferListItemDto,
  TreasuryBalanceSnapshotDto,
  TreasuryOverviewDto,
} from "@/modules/treasury/dto/treasury.dto";
import { buildReconciliationSuggestions } from "@/modules/treasury/domain/services/reconciliation.service";
import { treasuryOperationsRepository } from "@/modules/treasury/infrastructure/repositories/treasury-operations.repository";
import type {
  ReconciliationFilterValues,
  StatementImportFilterValues,
  TreasuryDocumentFilterValues,
} from "@/modules/treasury/validators/treasury-operations.validator";

function mapPaymentListItem(row: Awaited<ReturnType<typeof treasuryOperationsRepository.listPayments>>["rows"][number]): PaymentListItemDto {
  return {
    id: row.id,
    reference: row.reference ?? null,
    direction: row.direction,
    paymentDateIso: row.paymentDate.toISOString(),
    status: row.status,
    amount: row.amount.toString(),
    notes: row.notes ?? null,
    partyName: row.thirdParty?.name ?? null,
    methodName: row.method.name,
    treasuryAccountName: row.bankAccount?.name ?? row.cashAccount?.name ?? "Sin cuenta",
    treasuryAccountType: row.bankAccountId ? "BANK" : "CASH",
    journalEntryNumber: row.journalEntryNumber,
    allocationCount: row.allocations.length,
    version: row.version,
    voidReason: row.voidReason ?? null,
  };
}

function mapTransferListItem(row: Awaited<ReturnType<typeof treasuryOperationsRepository.listTransfers>>["rows"][number]): TransferListItemDto {
  return {
    id: row.id,
    reference: row.reference ?? null,
    transferDateIso: row.transferDate.toISOString(),
    status: row.status,
    amount: row.amount.toString(),
    notes: row.notes ?? null,
    sourceLabel: row.sourceBankAccount?.name ?? row.sourceCashAccount?.name ?? "Sin origen",
    destinationLabel:
      row.destinationBankAccount?.name ?? row.destinationCashAccount?.name ?? "Sin destino",
    journalEntryNumber: row.journalEntryNumber,
    version: row.version,
    voidReason: row.voidReason ?? null,
  };
}

function mapStatementImportListItem(
  row: Awaited<ReturnType<typeof treasuryOperationsRepository.listStatementImports>>["rows"][number],
): StatementImportListItemDto {
  return {
    id: row.id,
    fileName: row.fileName,
    status: row.status,
    bankAccountName: row.bankAccount.name,
    rowsCount: row.rowsCount,
    importedAtIso: row.importedAt?.toISOString() ?? null,
    createdAtIso: row.createdAt.toISOString(),
    sampleLines: row.lines.map((line) => ({
      id: line.id,
      transactionDateIso: line.transactionDate.toISOString(),
      description: line.description,
      amount: line.amount.toString(),
      balance: line.balance?.toString() ?? null,
    })),
  };
}

export async function getPaymentsPageData(input: {
  organizationId: string;
  filters: TreasuryDocumentFilterValues;
}): Promise<{
  rows: PaymentListItemDto[];
  totalItems: number;
  dependencies: PaymentFormDependenciesDto;
  editors: Record<string, PaymentEditorDto>;
}> {
  const [list, dependencies] = await Promise.all([
    treasuryOperationsRepository.listPayments(input),
    treasuryOperationsRepository.listPaymentFormDependencies(input.organizationId),
  ]);

  const details = await Promise.all(
    list.rows.map((row) =>
      treasuryOperationsRepository.findPaymentById({
        organizationId: input.organizationId,
        paymentId: row.id,
      }),
    ),
  );

  const editors = Object.fromEntries(
    details
      .filter((payment): payment is NonNullable<typeof payment> => Boolean(payment))
      .map((payment) => [
        payment.id,
        {
          id: payment.id,
          version: payment.version,
          thirdPartyId: payment.thirdPartyId ?? null,
          methodId: payment.methodId,
          bankAccountId: payment.bankAccountId ?? null,
          cashAccountId: payment.cashAccountId ?? null,
          direction: payment.direction,
          paymentDateIso: payment.paymentDate.toISOString(),
          amount: payment.amount.toString(),
          reference: payment.reference ?? null,
          notes: payment.notes ?? null,
          allocations: payment.allocations.map((allocation) => ({
            documentType: allocation.salesInvoiceId
              ? "SALES_INVOICE"
              : allocation.purchaseBillId
                ? "PURCHASE_BILL"
                : "EXPENSE",
            documentId:
              allocation.salesInvoiceId ?? allocation.purchaseBillId ?? allocation.expenseId ?? "",
            amount: allocation.amount.toString(),
          })),
        } satisfies PaymentEditorDto,
      ]),
  );

  return {
    rows: list.rows.map(mapPaymentListItem),
    totalItems: list.totalItems,
    dependencies: {
      thirdParties: dependencies.thirdParties.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
      methods: dependencies.methods.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
      bankAccounts: dependencies.bankAccounts.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
      cashAccounts: dependencies.cashAccounts.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
      openDocuments: dependencies.openDocuments,
    },
    editors,
  };
}

export async function getTransfersPageData(input: {
  organizationId: string;
  filters: TreasuryDocumentFilterValues;
}): Promise<{
  rows: TransferListItemDto[];
  totalItems: number;
  dependencies: TransferFormDependenciesDto;
  editors: Record<string, TransferEditorDto>;
}> {
  const [list, dependencies] = await Promise.all([
    treasuryOperationsRepository.listTransfers(input),
    treasuryOperationsRepository.listTransferFormDependencies(input.organizationId),
  ]);

  const details = await Promise.all(
    list.rows.map((row) =>
      treasuryOperationsRepository.findTransferById({
        organizationId: input.organizationId,
        transferId: row.id,
      }),
    ),
  );

  const editors = Object.fromEntries(
    details
      .filter((transfer): transfer is NonNullable<typeof transfer> => Boolean(transfer))
      .map((transfer) => [
        transfer.id,
        {
          id: transfer.id,
          version: transfer.version,
          sourceBankAccountId: transfer.sourceBankAccountId ?? null,
          sourceCashAccountId: transfer.sourceCashAccountId ?? null,
          destinationBankAccountId: transfer.destinationBankAccountId ?? null,
          destinationCashAccountId: transfer.destinationCashAccountId ?? null,
          transferDateIso: transfer.transferDate.toISOString(),
          amount: transfer.amount.toString(),
          reference: transfer.reference ?? null,
          notes: transfer.notes ?? null,
        } satisfies TransferEditorDto,
      ]),
  );

  return {
    rows: list.rows.map(mapTransferListItem),
    totalItems: list.totalItems,
    dependencies: {
      bankAccounts: dependencies.bankAccounts.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
      cashAccounts: dependencies.cashAccounts.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
    },
    editors,
  };
}

export async function getStatementImportsPageData(input: {
  organizationId: string;
  filters: StatementImportFilterValues;
}): Promise<{
  rows: StatementImportListItemDto[];
  totalItems: number;
  dependencies: StatementImportDependenciesDto;
}> {
  const [list, dependencies] = await Promise.all([
    treasuryOperationsRepository.listStatementImports(input),
    treasuryOperationsRepository.listStatementImportDependencies(input.organizationId),
  ]);

  return {
    rows: list.rows.map(mapStatementImportListItem),
    totalItems: list.totalItems,
    dependencies: {
      bankAccounts: dependencies.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
    },
  };
}

export async function getReconciliationsPageData(input: {
  organizationId: string;
  filters: ReconciliationFilterValues;
}): Promise<{
  rows: ReconciliationListItemDto[];
  totalItems: number;
  bankAccounts: Array<{ value: string; label: string }>;
}> {
  const [list, bankAccounts] = await Promise.all([
    treasuryOperationsRepository.listReconciliations(input),
    treasuryOperationsRepository.listReconciliationDependencies(input.organizationId),
  ]);

  const rows = await Promise.all(
    list.rows.map(async (row) => {
      const [statementLines, candidates] = row.bankAccountId
        ? await Promise.all([
            treasuryOperationsRepository.listUnreconciledBankStatementLines({
              organizationId: input.organizationId,
              bankAccountId: row.bankAccountId,
              periodStart: row.periodStart,
              periodEnd: row.periodEnd,
            }),
            treasuryOperationsRepository.listPostedBankDocumentsForMatching({
              organizationId: input.organizationId,
              bankAccountId: row.bankAccountId,
              periodStart: row.periodStart,
              periodEnd: row.periodEnd,
            }),
          ])
        : [[], { payments: [], outgoingTransfers: [], incomingTransfers: [] }];

      const suggestions = row.bankAccountId
        ? buildReconciliationSuggestions({
            statementLines: statementLines.map((line) => ({
              id: line.id,
              transactionDate: line.transactionDate,
              description: line.description,
              reference: line.reference ?? null,
              amount: line.amount,
            })),
            payments: candidates.payments.map((payment) => ({
              id: payment.id,
              paymentDate: payment.paymentDate,
              reference: payment.reference ?? null,
              direction: payment.direction,
              amount: payment.amount,
              thirdPartyName: payment.thirdParty?.name ?? null,
            })),
            outgoingTransfers: candidates.outgoingTransfers.map((transfer) => ({
              id: transfer.id,
              transferDate: transfer.transferDate,
              reference: transfer.reference ?? null,
              direction: "OUT" as const,
              amount: transfer.amount,
            })),
            incomingTransfers: candidates.incomingTransfers.map((transfer) => ({
              id: transfer.id,
              transferDate: transfer.transferDate,
              reference: transfer.reference ?? null,
              direction: "IN" as const,
              amount: transfer.amount,
            })),
          })
        : [];

      return {
        id: row.id,
        bankAccountName: row.bankAccount?.name ?? "Sin cuenta",
        periodStartIso: row.periodStart.toISOString(),
        periodEndIso: row.periodEnd.toISOString(),
        statementBalance: row.statementBalance.toString(),
        bookBalance: row.bookBalance.toString(),
        status: row.status,
        notes: row.notes ?? null,
        lineCount: row._count.lines,
        suggestions,
      } satisfies ReconciliationListItemDto;
    }),
  );

  return {
    rows,
    totalItems: list.totalItems,
    bankAccounts: bankAccounts.map((item) => ({
      value: item.id,
      label: `${item.code} · ${item.name}`,
    })),
  };
}

export async function getTreasuryOverview(input: {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}): Promise<TreasuryOverviewDto> {
  const [balances, payments, transfers, imports, reconciliations] = await Promise.all([
    treasuryOperationsRepository.computeTreasuryBalances(input.organizationId),
    treasuryOperationsRepository.listPayments({
      organizationId: input.organizationId,
      filters: {
        q: "",
        status: "ALL",
        page: 1,
        direction: "ALL",
      },
    }),
    treasuryOperationsRepository.listTransfers({
      organizationId: input.organizationId,
      filters: {
        q: "",
        status: "ALL",
        page: 1,
        direction: "ALL",
      },
    }),
    treasuryOperationsRepository.listStatementImports({
      organizationId: input.organizationId,
      filters: {
        status: "ALL",
        page: 1,
      },
    }),
    getReconciliationsPageData({
      organizationId: input.organizationId,
      filters: {
        status: "ALL",
        page: 1,
      },
    }),
  ]);

  return {
    organizationSlug: input.organizationSlug,
    organizationName: input.organizationName,
    metrics: {
      availableBanks: balances.bankBalances
        .reduce((acc, item) => acc + Number(item.balance), 0)
        .toFixed(2),
      availableCash: balances.cashBalances
        .reduce((acc, item) => acc + Number(item.balance), 0)
        .toFixed(2),
      pendingImports: imports.rows.filter((item) => item.status !== "COMPLETED").length,
      openReconciliations: reconciliations.rows.filter((item) => item.status !== "COMPLETED").length,
    },
    bankBalances: balances.bankBalances,
    cashBalances: balances.cashBalances,
    recentPayments: payments.rows.slice(0, 5).map(mapPaymentListItem),
    recentTransfers: transfers.rows.slice(0, 5).map(mapTransferListItem),
    recentImports: imports.rows.slice(0, 3).map(mapStatementImportListItem),
    recentReconciliations: reconciliations.rows.slice(0, 3),
  };
}

export async function getCashStatePageData(organizationId: string): Promise<TreasuryBalanceSnapshotDto> {
  return treasuryOperationsRepository.computeTreasuryBalances(organizationId);
}
