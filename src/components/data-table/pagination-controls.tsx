import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CatalogPagination } from "@/modules/shared/dto/catalog-management.dto";

type PaginationControlsProps = {
  basePath: string;
  filters: Record<string, string | number | undefined>;
  pagination: CatalogPagination;
};

function buildHref(
  basePath: string,
  filters: Record<string, string | number | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || value === "ALL" || key === "page") {
      continue;
    }

    params.set(key, String(value));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function PaginationControls({
  basePath,
  filters,
  pagination,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-emerald-950/5 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Pagina {pagination.page} de {pagination.totalPages} · {pagination.totalItems} registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={pagination.page <= 1}
        >
          <Link
            href={buildHref(basePath, filters, Math.max(1, pagination.page - 1))}
            aria-disabled={pagination.page <= 1}
          >
            Anterior
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={pagination.page >= pagination.totalPages}
        >
          <Link
            href={buildHref(basePath, filters, Math.min(pagination.totalPages, pagination.page + 1))}
            aria-disabled={pagination.page >= pagination.totalPages}
          >
            Siguiente
          </Link>
        </Button>
      </div>
    </div>
  );
}
