"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, CalendarDays, LoaderCircle, PencilLine, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { saveTransferDraftAction } from "@/modules/treasury/application/commands/treasury.commands";
import type {
  TransferEditorDto,
  TransferFormDependenciesDto,
  TransferFormInput,
} from "@/modules/treasury/dto/treasury.dto";
import {
  transferFormSchema,
  type TransferFormValues,
} from "@/modules/treasury/validators/treasury-operations.validator";

type TransferFormDialogProps = {
  organizationSlug: string;
  dependencies: TransferFormDependenciesDto;
  transfer?: TransferEditorDto;
};

function toRequiredDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function getDefaultValues(transfer?: TransferEditorDto): TransferFormValues {
  return {
    id: transfer?.id,
    version: transfer?.version,
    sourceBankAccountId: transfer?.sourceBankAccountId ?? "",
    sourceCashAccountId: transfer?.sourceCashAccountId ?? "",
    destinationBankAccountId: transfer?.destinationBankAccountId ?? "",
    destinationCashAccountId: transfer?.destinationCashAccountId ?? "",
    transferDate: toRequiredDateInput(transfer?.transferDateIso),
    amount: transfer?.amount ?? "0.00",
    reference: transfer?.reference ?? "",
    notes: transfer?.notes ?? "",
  };
}

export function TransferFormDialog({
  organizationSlug,
  dependencies,
  transfer,
}: TransferFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema) as never,
    defaultValues: getDefaultValues(transfer),
  });

  useEffect(() => {
    form.reset(getDefaultValues(transfer));
  }, [form, open, transfer]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await saveTransferDraftAction(organizationSlug, values as unknown as TransferFormInput);
      if (!result.success) {
        setServerError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {transfer ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nuevo traslado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{transfer ? "Editar traslado" : "Nuevo traslado"}</DialogTitle>
          <DialogDescription>
            Mueve liquidez entre bancos y caja sin perder trazabilidad contable.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Banco origen</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("sourceBankAccountId")}
              >
                <option value="">No usar banco</option>
                {dependencies.bankAccounts.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Caja origen</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("sourceCashAccountId")}
              >
                <option value="">No usar caja</option>
                {dependencies.cashAccounts.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Banco destino</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("destinationBankAccountId")}
              >
                <option value="">No usar banco</option>
                {dependencies.bankAccounts.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Caja destino</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("destinationCashAccountId")}
              >
                <option value="">No usar caja</option>
                {dependencies.cashAccounts.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-10" {...form.register("transferDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monto</Label>
              <Input inputMode="decimal" {...form.register("amount")} />
            </div>

            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input placeholder="Soporte operativo" {...form.register("reference")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea rows={3} placeholder="Detalle del movimiento interno." {...form.register("notes")} />
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
              {transfer ? "Guardar borrador" : "Crear borrador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
