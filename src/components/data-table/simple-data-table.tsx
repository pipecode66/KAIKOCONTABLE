import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  return (
    <div className="overflow-hidden rounded-[28px] border border-emerald-950/5 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>{String(row[column.key] ?? "")}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
