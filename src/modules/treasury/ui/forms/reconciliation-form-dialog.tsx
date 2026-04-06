"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LoaderCircle, Plus, ScanSearch } from "lucide-react";
import { useState, useTransition } from "react";
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
import { createReconciliationAction } from "@/modules/treasury/application/commands/treasury.commands";
import type { ReconciliationCreateInput } from "@/modules/treasury/dto/treasury.dto";
import {
  reconciliationCreateSchema,
  type ReconciliationCreateValues,
} from "@/modules/treasury/validators/treasury-operations.validator";

type ReconciliationFormDialogProps = {
  organizationSlug: string;
  bankAccounts: Array<{ value: string; label: string }>;
};

export function ReconciliationFormDialog({
  organizationSlug,
  bankAccounts,
}: ReconciliationFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReconciliationCreateValues>({
    resolver: zodResolver(reconciliationCreateSchema) as never,
    defaultValues: {
      bankAccountId: "",
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      periodEnd: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createReconciliationAction(
        organizationSlug,
        values as unknown as ReconciliationCreateInput,
      );

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
        <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
          <Plus className="size-4" />
          Nueva conciliacion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>Nueva conciliacion bancaria</DialogTitle>
          <DialogDescription>
            Selecciona cuenta y rango. El sistema sugerira cruces sobre pagos y traslados publicados.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cuenta bancaria</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("bankAccountId")}
              >
                <option value="">Selecciona una cuenta</option>
                {bankAccounts.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Desde</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-10" {...form.register("periodStart")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hasta</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-10" {...form.register("periodEnd")} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea rows={3} placeholder="Observaciones de cierre o validacion del extracto." {...form.register("notes")} />
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
              Crear conciliacion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
