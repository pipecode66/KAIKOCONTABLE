import { formatMoneyForOrganization } from "@/lib/formatting/number-format";
import type { AccountingCatalogKey } from "@/modules/accounting/dto/catalogs.dto";
import { accountingCatalogRepository } from "@/modules/accounting/infrastructure/repositories/accounting-catalog.repository";
import type { CatalogFilters } from "@/modules/shared/dto/catalog-management.dto";

export type AccountingCatalogPageRowStatus = "ACTIVE" | "ARCHIVED" | "INACTIVE";

export type AccountingCatalogPageRow = {
  id: string;
  status: AccountingCatalogPageRowStatus;
  summary: string;
  detail: string;
  tags: string[];
  columns: Record<string, string>;
  raw: Record<string, unknown>;
};

type GetAccountingCatalogPageDataInput = {
  organizationId: string;
  locale: string;
  currencyCode: string;
  catalog: AccountingCatalogKey;
  filters: CatalogFilters;
};

type AccountingCatalogPageDataResult = {
  dependencies: Awaited<ReturnType<typeof accountingCatalogRepository.listDependencies>>;
  totalItems: number;
  rows: AccountingCatalogPageRow[];
};

export async function getAccountingCatalogPageData(
  input: GetAccountingCatalogPageDataInput,
): Promise<AccountingCatalogPageDataResult> {
  const dependencies = await accountingCatalogRepository.listDependencies(input.organizationId);

  switch (input.catalog) {
    case "third-parties": {
      const { rows, totalItems } = await accountingCatalogRepository.listThirdParties({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        dependencies,
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: row.legalName ?? row.taxId ?? "Sin identificacion adicional",
          tags: [row.type, row.taxClassification ?? "SIN_CLASIFICACION"],
          columns: {
            code: row.code,
            name: row.name,
            email: row.email ?? "Sin correo",
          },
          raw: row,
        })),
      };
    }
    case "taxes": {
      const { rows, totalItems } = await accountingCatalogRepository.listTaxes({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        dependencies,
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: `${row.kind} · ${row.treatment}`,
          tags: [row.kind, row.isWithholding ? "WITHHOLDING" : "STANDARD"],
          columns: {
            code: row.code,
            rate: `${row.rate.toString()}%`,
            treatment: row.treatment,
          },
          raw: row,
        })),
      };
    }
    case "tax-rules": {
      const { rows, totalItems } = await accountingCatalogRepository.listTaxRules({
        organizationId: input.organizationId,
        filters: input.filters,
      });
      const now = new Date();

      return {
        dependencies,
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status:
            row.effectiveFrom <= now && (!row.effectiveTo || row.effectiveTo >= now)
              ? ("ACTIVE" as const)
              : ("INACTIVE" as const),
          summary: row.name,
          detail: `${row.tax.code} · ${row.tax.name}`,
          tags: [
            `P${row.priority}`,
            row.documentType ?? "ALL_DOCS",
            row.operationType ?? "ALL_OPS",
          ],
          columns: {
            tax: row.tax.code,
            effectiveFrom: row.effectiveFrom.toISOString(),
            effectiveTo: row.effectiveTo?.toISOString() ?? "Abierta",
          },
          raw: row,
        })),
      };
    }
    case "cost-centers": {
      const { rows, totalItems } = await accountingCatalogRepository.listCostCenters({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        dependencies,
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: row.description ?? "Sin descripcion",
          tags: ["ANALITICA"],
          columns: {
            code: row.code,
            name: row.name,
            description: row.description ?? "Sin descripcion",
          },
          raw: row,
        })),
      };
    }
    case "catalog-items": {
      const { rows, totalItems } = await accountingCatalogRepository.listCatalogItems({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        dependencies,
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt
            ? ("ARCHIVED" as const)
            : row.isActive
              ? ("ACTIVE" as const)
              : ("INACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail:
            row.defaultLedgerAccount?.code && row.defaultTax?.code
              ? `${row.defaultLedgerAccount.code} · ${row.defaultTax.code}`
              : row.defaultLedgerAccount?.code ?? row.defaultTax?.code ?? "Sin defaults",
          tags: [row.isActive ? "ACTIVE" : "INACTIVE"],
          columns: {
            code: row.code,
            price: formatMoneyForOrganization(Number(row.defaultUnitPrice), {
              locale: input.locale,
              currencyCode: input.currencyCode,
            }),
            defaults: `${row.defaultLedgerAccount?.code ?? "-"} / ${row.defaultTax?.code ?? "-"}`,
          },
          raw: row,
        })),
      };
    }
  }
}
