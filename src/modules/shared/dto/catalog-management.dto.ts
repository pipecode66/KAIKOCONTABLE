export type CatalogFilters = {
  q: string;
  status: "ALL" | "ACTIVE" | "ARCHIVED" | "INACTIVE";
  page: number;
};

export type CatalogPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CatalogActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type CatalogSelectOption = {
  value: string;
  label: string;
};
