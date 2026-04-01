"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LoaderCircle, PencilLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { saveSalesInvoiceDraftAction } from "@/modules/sales/application/commands/sales-invoice.commands";
import type {
  SalesInvoiceEditorDto,
  SalesInvoiceFormDependenciesDto,
  SalesInvoiceFormInput,
} from "@/modules/sales/dto/sales.dto";
import {
  salesInvoiceFormSchema,
  type SalesInvoiceFormValues,
} from "@/modules/sales/validators/sales-invoice.validator";

type SalesInvoiceFormDialogProps = {
  organizationSlug: string;
  dependencies: SalesInvoiceFormDependenciesDto;
  invoice?: SalesInvoiceEditorDto;
};

function toDateInput(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function getDefaultValues(invoice?: SalesInvoiceEditorDto): SalesInvoiceFormValues {
  return {
    id: invoice?.id,
    version: invoice?.version,
    customerId: invoice?.customerId ?? "",
    issueDate: toDateInput(invoice?.issueDateIso),
    dueDate: toDateInput(invoice?.dueDateIso),
    notes: invoice?.notes ?? "",
    lines:
      invoice?.lines.map((line) => ({
        itemId: line.itemId ?? "",
        accountId: line.accountId ?? "",
        taxId: line.taxId ?? "",
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })) ?? [
        {
          itemId: "",
          accountId: "",
          taxId: "",
          description: "",
          quantity: "1.0000",
          unitPrice: "0.00",
        },
      ],
  };
}

export function SalesInvoiceFormDialog({
  organizationSlug,
  dependencies,
  invoice,
}: SalesInvoiceFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(salesInvoiceFormSchema) as never,
    defaultValues: getDefaultValues(invoice),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    form.reset(getDefaultValues(invoice));
  }, [invoice, form, open]);

  const itemsById = useMemo(
    () => new Map(dependencies.items.map((item) => [item.value, item])),
    [dependencies.items],
  );

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await saveSalesInvoiceDraftAction(
        organizationSlug,
        values as unknown as SalesInvoiceFormInput,
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
        {invoice ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nueva factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{invoice ? "Editar factura de venta" : "Nueva factura de venta"}</DialogTitle>
          <DialogDescription>
            La factura se guarda en borrador y toma numeracion oficial solo al publicarse.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`customer-${invoice?.id ?? "new"}`}>Cliente</Label>
              <select
                id={`customer-${invoice?.id ?? "new"}`}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("customerId")}
              >
                <option value="">Selecciona un cliente</option>
                {dependencies.customers.map((customer) => (
                  <option key={customer.value} value={customer.value}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`issue-date-${invoice?.id ?? "new"}`}>Fecha de emision</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`issue-date-${invoice?.id ?? "new"}`}
                  type="date"
                  className="pl-10"
                  {...form.register("issueDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`due-date-${invoice?.id ?? "new"}`}>Vencimiento</Label>
              <Input
                id={`due-date-${invoice?.id ?? "new"}`}
                type="date"
                {...form.register("dueDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${invoice?.id ?? "new"}`}>Notas</Label>
            <Textarea
              id={`notes-${invoice?.id ?? "new"}`}
              rows={3}
              placeholder="Observaciones comerciales o de servicio."
              {...form.register("notes")}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl font-semibold text-slate-950">Lineas del documento</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Define item, cuenta, impuesto y valores. Los totales se recalculan en el servidor.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  append({
                    itemId: "",
                    accountId: "",
                    taxId: "",
                    description: "",
                    quantity: "1.0000",
                    unitPrice: "0.00",
                  })
                }
              >
                <Plus className="size-4" />
                Agregar linea
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const itemRegistration = form.register(`lines.${index}.itemId`);

                return (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-[24px] border border-emerald-950/5 bg-slate-50/70 p-4 lg:grid-cols-[180px_180px_180px_minmax(0,1fr)_120px_120px_auto]"
                  >
                    <div className="space-y-2">
                      <Label>Item</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        {...itemRegistration}
                        onChange={(event) => {
                          itemRegistration.onChange(event);
                          const selectedItem = itemsById.get(event.target.value);

                          if (selectedItem?.defaultAccountId && !form.getValues(`lines.${index}.accountId`)) {
                            form.setValue(`lines.${index}.accountId`, selectedItem.defaultAccountId, {
                              shouldDirty: true,
                            });
                          }

                          if (selectedItem?.defaultTaxId && !form.getValues(`lines.${index}.taxId`)) {
                            form.setValue(`lines.${index}.taxId`, selectedItem.defaultTaxId, {
                              shouldDirty: true,
                            });
                          }
                        }}
                      >
                        <option value="">Sin item</option>
                        {dependencies.items.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cuenta</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        {...form.register(`lines.${index}.accountId`)}
                      >
                        <option value="">Selecciona una cuenta</option>
                        {dependencies.accounts.map((account) => (
                          <option key={account.value} value={account.value}>
                            {account.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Impuesto</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        {...form.register(`lines.${index}.taxId`)}
                      >
                        <option value="">Sin impuesto</option>
                        {dependencies.taxes.map((tax) => (
                          <option key={tax.value} value={tax.value}>
                            {tax.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripcion</Label>
                      <Input
                        placeholder="Servicio o concepto facturado"
                        {...form.register(`lines.${index}.description`)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input inputMode="decimal" {...form.register(`lines.${index}.quantity`)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor unitario</Label>
                      <Input inputMode="decimal" {...form.register(`lines.${index}.unitPrice`)} />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
              {invoice ? "Guardar borrador" : "Crear borrador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
