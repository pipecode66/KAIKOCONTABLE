import type { TreasuryCatalogKey } from "@/modules/treasury/dto/catalogs.dto";
import { treasuryCatalogRepository } from "@/modules/treasury/infrastructure/repositories/treasury-catalog.repository";
import type { CatalogFilters } from "@/modules/shared/dto/catalog-management.dto";

export type TreasuryCatalogPageRowStatus = "ACTIVE" | "ARCHIVED";

export type TreasuryCatalogPageRow = {
  id: string;
  status: TreasuryCatalogPageRowStatus;
  summary: string;
  detail: string;
  columns: Record<string, string>;
  raw: Record<string, unknown>;
};

type GetTreasuryCatalogPageDataInput = {
  organizationId: string;
  catalog: TreasuryCatalogKey;
  filters: CatalogFilters;
};

type GetTreasuryCatalogPageDataResult = {
  totalItems: number;
  rows: TreasuryCatalogPageRow[];
};

export async function getTreasuryCatalogPageData(
  input: GetTreasuryCatalogPageDataInput,
): Promise<GetTreasuryCatalogPageDataResult> {
  switch (input.catalog) {
    case "payment-methods": {
      const { rows, totalItems } = await treasuryCatalogRepository.listPaymentMethods({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: row.description ?? "Sin descripcion",
          columns: {
            code: row.code,
            name: row.name,
            description: row.description ?? "Sin descripcion",
          },
          raw: row,
        })),
      };
    }
    case "bank-accounts": {
      const { rows, totalItems } = await treasuryCatalogRepository.listBankAccounts({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: `${row.bankName} · ${row.accountNumber}`,
          columns: {
            code: row.code,
            bankName: row.bankName,
            accountType: row.accountType,
          },
          raw: row,
        })),
      };
    }
    case "cash-accounts": {
      const { rows, totalItems } = await treasuryCatalogRepository.listCashAccounts({
        organizationId: input.organizationId,
        filters: input.filters,
      });

      return {
        totalItems,
        rows: rows.map((row) => ({
          id: row.id,
          status: row.deletedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          summary: `${row.code} · ${row.name}`,
          detail: row.location ?? "Sin ubicacion",
          columns: {
            code: row.code,
            name: row.name,
            location: row.location ?? "Sin ubicacion",
          },
          raw: row,
        })),
      };
    }
  }
}
