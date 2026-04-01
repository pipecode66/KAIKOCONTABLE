import { BaseDataTable } from "@/components/data-table/base-data-table";

type Column<T> = {
  key: keyof T;
  title: string;
};

type SimpleDataTableProps<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  rows: T[];
};

export function SimpleDataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: SimpleDataTableProps<T>) {
  return <BaseDataTable columns={columns} rows={rows} />;
}
