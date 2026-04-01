"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LoaderCircle, PencilLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { voucherTypeOptions, type ManualVoucherFormInput, type ManualVoucherListItemDto, type VoucherFormDependenciesDto } from "@/modules/accounting/dto/accounting-core.dto";
import { saveManualVoucherDraftAction } from "@/modules/accounting/application/commands/accounting-core.commands";
import {
  manualVoucherFormSchema,
  type ManualVoucherFormValues,
} from "@/modules/accounting/validators/manual-voucher-form.validator";

type ManualVoucherFormDialogProps = {
  organizationSlug: string;
  dependencies: VoucherFormDependenciesDto;
  voucher?: ManualVoucherListItemDto;
};

function toDateInput(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function getDefaultValues(voucher?: ManualVoucherListItemDto): ManualVoucherFormValues {
  return {
    id: voucher?.id,
    version: voucher?.version,
    voucherType: voucher?.voucherType ?? "MANUAL_ADJUSTMENT",
    entryDate: toDateInput(voucher?.entryDateIso),
    description: voucher?.description ?? "",
    lines:
      voucher?.lines.map((line) => ({
        ledgerAccountId: "",
        description: line.description ?? `${line.ledgerAccountCode} - ${line.ledgerAccountName}`,
        debit: line.debit,
        credit: line.credit,
      })) ?? [
        {
          ledgerAccountId: "",
          description: "",
          debit: "0.00",
          credit: "0.00",
        },
        {
          ledgerAccountId: "",
          description: "",
          debit: "0.00",
          credit: "0.00",
        },
      ],
  };
}

export function ManualVoucherFormDialog({
  organizationSlug,
  dependencies,
  voucher,
}: ManualVoucherFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ManualVoucherFormValues>({
    resolver: zodResolver(manualVoucherFormSchema) as never,
    defaultValues: getDefaultValues(voucher),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const watchedLines = useWatch({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    form.reset(getDefaultValues(voucher));
  }, [voucher, form, open]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveManualVoucherDraftAction(
        organizationSlug,
        values as unknown as ManualVoucherFormInput,
      );

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  });

  const accountsByCode = useMemo(
    () => new Map(dependencies.accounts.map((account) => [account.id, `${account.code} - ${account.name}`])),
    [dependencies.accounts],
  );

  useEffect(() => {
    if (!voucher) {
      return;
    }

    voucher.lines.forEach((line, index) => {
      const matchingAccount = dependencies.accounts.find(
        (account) => `${account.code} - ${account.name}` === `${line.ledgerAccountCode} - ${line.ledgerAccountName}`,
      );

      if (matchingAccount) {
        form.setValue(`lines.${index}.ledgerAccountId`, matchingAccount.id, {
          shouldDirty: false,
        });
      }
    });
  }, [dependencies.accounts, form, voucher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {voucher ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nuevo voucher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{voucher ? "Editar voucher manual" : "Nuevo voucher manual"}</DialogTitle>
          <DialogDescription>
            Construye el asiento en borrador, valida balance y deja el numero oficial para el momento del posteo.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`voucher-type-${voucher?.id ?? "new"}`}>Tipo de voucher</Label>
              <select
                id={`voucher-type-${voucher?.id ?? "new"}`}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("voucherType")}
              >
                {voucherTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`voucher-date-${voucher?.id ?? "new"}`}>Fecha contable</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`voucher-date-${voucher?.id ?? "new"}`}
                  type="date"
                  className="pl-10"
                  {...form.register("entryDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Periodos abiertos</Label>
              <div className="rounded-xl border border-emerald-950/5 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
                {dependencies.openPeriods.length > 0
                  ? dependencies.openPeriods.map((period) => period.label).join(", ")
                  : "No hay periodos abiertos configurados"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`voucher-description-${voucher?.id ?? "new"}`}>Descripcion</Label>
            <Textarea
              id={`voucher-description-${voucher?.id ?? "new"}`}
              rows={3}
              placeholder="Ej. Reclasificacion de soporte o saldo inicial de apertura."
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-rose-600">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl font-semibold text-slate-950">Lineas contables</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Cada linea debe tener una cuenta activa y un solo lado monetario.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  append({
                    ledgerAccountId: "",
                    description: "",
                    debit: "0.00",
                    credit: "0.00",
                  })
                }
              >
                <Plus className="size-4" />
                Agregar linea
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-[24px] border border-emerald-950/5 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_150px_auto]"
                >
                  <div className="space-y-2">
                    <Label>Cuenta</Label>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                      {...form.register(`lines.${index}.ledgerAccountId`)}
                    >
                      <option value="">Selecciona una cuenta</option>
                      {dependencies.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripcion</Label>
                    <Input
                      placeholder={
                        watchedLines?.[index]?.ledgerAccountId
                          ? accountsByCode.get(watchedLines[index]?.ledgerAccountId ?? "") ?? ""
                          : "Contexto de la linea"
                      }
                      {...form.register(`lines.${index}.description`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Debito</Label>
                    <Input inputMode="decimal" placeholder="0.00" {...form.register(`lines.${index}.debit`)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Credito</Label>
                    <Input inputMode="decimal" placeholder="0.00" {...form.register(`lines.${index}.credit`)} />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}
          {form.formState.errors.lines ? (
            <p className="text-sm text-rose-600">{form.formState.errors.lines.message as string}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {voucher ? "Guardar borrador" : "Crear borrador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
