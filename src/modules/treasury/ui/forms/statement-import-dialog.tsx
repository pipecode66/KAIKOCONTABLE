"use client";

import { LoaderCircle, Plus, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StatementImportDependenciesDto } from "@/modules/treasury/dto/treasury.dto";
import { requestStatementImportAction } from "@/modules/treasury/application/commands/treasury.commands";

type StatementImportDialogProps = {
  organizationSlug: string;
  dependencies: StatementImportDependenciesDto;
};

export function StatementImportDialog({
  organizationSlug,
  dependencies,
}: StatementImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
          <Plus className="size-4" />
          Importar extracto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>Importar extracto CSV</DialogTitle>
          <DialogDescription>
            Sube un CSV con columnas `transactionDate`, `description`, `amount` y opcionalmente `reference`, `balance`.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label>Cuenta bancaria</Label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
              value={selectedBankAccountId}
              onChange={(event) => setSelectedBankAccountId(event.target.value)}
            >
              <option value="">Selecciona una cuenta</option>
              {dependencies.bankAccounts.map((account) => (
                <option key={account.value} value={account.value}>
                  {account.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Archivo CSV</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending || !file || !selectedBankAccountId}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() =>
                startTransition(async () => {
                  setServerError(null);

                  if (!file) {
                    setServerError("Selecciona un archivo CSV.");
                    return;
                  }

                  const csvContent = await file.text();
                  const result = await requestStatementImportAction(organizationSlug, {
                    bankAccountId: selectedBankAccountId,
                    fileName: file.name,
                    csvContent,
                  });

                  if (!result.success) {
                    setServerError(result.message);
                    return;
                  }

                  setOpen(false);
                  setFile(null);
                  setSelectedBankAccountId("");
                  router.refresh();
                })
              }
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Cargar y procesar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
