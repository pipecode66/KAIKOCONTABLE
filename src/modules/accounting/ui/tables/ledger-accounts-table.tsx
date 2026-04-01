import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  LedgerAccountListItemDto,
  LedgerAccountParentOptionDto,
} from "@/modules/accounting/dto/ledger-account.dto";
import { ArchiveLedgerAccountButton } from "@/modules/accounting/ui/components/archive-ledger-account-button";
import { LedgerAccountFormDialog } from "@/modules/accounting/ui/forms/ledger-account-form-dialog";

type LedgerAccountsTableProps = {
  organizationSlug: string;
  rows: LedgerAccountListItemDto[];
  parentOptions: LedgerAccountParentOptionDto[];
  canManage: boolean;
};

function typeLabel(type: LedgerAccountListItemDto["type"]) {
  switch (type) {
    case "ASSET":
      return "Activo";
    case "LIABILITY":
      return "Pasivo";
    case "EQUITY":
      return "Patrimonio";
    case "REVENUE":
      return "Ingreso";
    case "EXPENSE":
      return "Gasto";
    case "COST_OF_SALES":
      return "Costo";
    case "MEMORANDUM":
      return "Memorando";
  }
}

function balanceLabel(balance: LedgerAccountListItemDto["normalBalance"]) {
  return balance === "DEBIT" ? "Debito" : "Credito";
}

export function LedgerAccountsTable({
  organizationSlug,
  rows,
  parentOptions,
  canManage,
}: LedgerAccountsTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-emerald-950/5 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <Table>
        <TableHeader>
          <TableRow className="border-emerald-950/5 bg-emerald-50/60">
            <TableHead className="px-4">Codigo</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Jerarquia</TableHead>
            <TableHead>Uso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="px-4 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                No encontramos cuentas con los filtros actuales.
              </TableCell>
            </TableRow>
          ) : null}

          {rows.map((row) => (
            <TableRow key={row.id} className={row.status === "ARCHIVED" ? "opacity-70" : undefined}>
              <TableCell className="px-4 font-medium text-slate-900">{row.code}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{row.name}</p>
                  {row.description ? (
                    <p className="max-w-md truncate text-xs text-slate-500">{row.description}</p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{typeLabel(row.type)}</TableCell>
              <TableCell>{balanceLabel(row.normalBalance)}</TableCell>
              <TableCell>
                {row.parentCode ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-800">{row.parentCode}</p>
                    <p className="text-xs text-slate-500">{row.parentName}</p>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Raiz</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={row.isPosting ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600"}
                  >
                    {row.isPosting ? "Posteo" : "Jerarquia"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      row.allowManualEntries
                        ? "border-emerald-200 text-emerald-700"
                        : "border-slate-200 text-slate-600"
                    }
                  >
                    {row.allowManualEntries ? "Manual" : "Solo automatico"}
                  </Badge>
                  {row.hasChildren ? (
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      Con hijas
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    row.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {row.status === "ACTIVE" ? "Activa" : "Archivada"}
                </Badge>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center justify-end gap-2">
                  {canManage && row.status === "ACTIVE" ? (
                    <>
                      <LedgerAccountFormDialog
                        organizationSlug={organizationSlug}
                        account={row}
                        parentOptions={parentOptions}
                      />
                      <ArchiveLedgerAccountButton
                        organizationSlug={organizationSlug}
                        accountId={row.id}
                        accountCode={row.code}
                        accountName={row.name}
                      />
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Solo lectura</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
