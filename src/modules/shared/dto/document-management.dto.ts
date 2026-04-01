export type DocumentListFilters = {
  q: string;
  status: "ALL" | "DRAFT" | "POSTED" | "VOIDED";
  page: number;
};
