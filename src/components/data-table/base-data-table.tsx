import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BaseColumn<T> = {
  key: keyof T;
  title: string;
  className?: string;
  render?: (row: T) => ReactNode;
};

type BaseDataTableProps<T extends Record<string, unknown>> = {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  columns: BaseColumn<T>[];
  rows: T[];
  emptyState?: ReactNode;
};

export function BaseDataTable<T extends Record<string, unknown>>({
  title,
  description,
  toolbar,
  columns,
  rows,
  emptyState,
}: BaseDataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-emerald-950/5 bg-white/95 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      {title || description || toolbar ? (
        <div className="flex flex-col gap-4 border-b border-emerald-950/5 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {title ? <h3 className="font-heading text-xl font-semibold text-slate-950">{title}</h3> : null}
            {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow className="border-emerald-950/5 bg-emerald-50/60">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={column.className}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState ?? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No hay datos para mostrar.
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)} className={column.className}>
                  {column.render ? column.render(row) : String(row[column.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
