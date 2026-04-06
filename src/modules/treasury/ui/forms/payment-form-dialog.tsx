"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LoaderCircle, PencilLine, Plus, Trash2, Wallet } from "lucide-react";
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
import { savePaymentDraftAction } from "@/modules/treasury/application/commands/treasury.commands";
import type {
  PaymentEditorDto,
  PaymentFormDependenciesDto,
  PaymentFormInput,
} from "@/modules/treasury/dto/treasury.dto";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/modules/treasury/validators/treasury-operations.validator";

type PaymentFormDialogProps = {
  organizationSlug: string;
  dependencies: PaymentFormDependenciesDto;
  payment?: PaymentEditorDto;
};

function toRequiredDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function getDefaultValues(payment?: PaymentEditorDto): PaymentFormValues {
  return {
    id: payment?.id,
    version: payment?.version,
    thirdPartyId: payment?.thirdPartyId ?? "",
    methodId: payment?.methodId ?? "",
    bankAccountId: payment?.bankAccountId ?? "",
    cashAccountId: payment?.cashAccountId ?? "",
    direction: payment?.direction ?? "RECEIVED",
    paymentDate: toRequiredDateInput(payment?.paymentDateIso),
    amount: payment?.amount ?? "0.00",
    reference: payment?.reference ?? "",
    notes: payment?.notes ?? "",
    allocations:
      payment?.allocations.map((allocation) => ({
        documentType: allocation.documentType,
        documentId: allocation.documentId,
        amount: allocation.amount,
      })) ?? [
        {
          documentType: "SALES_INVOICE",
          documentId: "",
          amount: "0.00",
        },
      ],
  };
}

export function PaymentFormDialog({
  organizationSlug,
  dependencies,
  payment,
}: PaymentFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema) as never,
    defaultValues: getDefaultValues(payment),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  });
  const allocations = useWatch({
    control: form.control,
    name: "allocations",
  });

  useEffect(() => {
    form.reset(getDefaultValues(payment));
  }, [payment, form, open]);

  const direction = useWatch({
    control: form.control,
    name: "direction",
  });

  const documentsByType = useMemo(
    () => ({
      SALES_INVOICE: dependencies.openDocuments.filter((item) => item.documentType === "SALES_INVOICE"),
      PURCHASE_BILL: dependencies.openDocuments.filter((item) => item.documentType === "PURCHASE_BILL"),
      EXPENSE: dependencies.openDocuments.filter((item) => item.documentType === "EXPENSE"),
    }),
    [dependencies.openDocuments],
  );

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await savePaymentDraftAction(organizationSlug, values as unknown as PaymentFormInput);

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
        {payment ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nuevo pago
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{payment ? "Editar pago" : "Nuevo pago"}</DialogTitle>
          <DialogDescription>
            El pago se guarda en borrador y solo toma referencia oficial cuando se publica.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Tercero</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("thirdPartyId")}
              >
                <option value="">Sin tercero especifico</option>
                {dependencies.thirdParties.map((thirdParty) => (
                  <option key={thirdParty.value} value={thirdParty.value}>
                    {thirdParty.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Metodo</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("methodId")}
              >
                <option value="">Selecciona un metodo</option>
                {dependencies.methods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Direccion</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("direction")}
              >
                <option value="RECEIVED">Recibido</option>
                <option value="SENT">Enviado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-10" {...form.register("paymentDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cuenta bancaria</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("bankAccountId")}
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
              <Label>Caja</Label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                {...form.register("cashAccountId")}
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
              <Label>Monto</Label>
              <Input inputMode="decimal" {...form.register("amount")} />
            </div>

            <div className="space-y-2">
              <Label>Referencia externa</Label>
              <Input placeholder="Recibo, transaccion o soporte" {...form.register("reference")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea rows={3} placeholder="Observaciones operativas del movimiento." {...form.register("notes")} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl font-semibold text-slate-950">Aplicaciones</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Conecta el pago con facturas o gastos abiertos para alimentar cartera y conciliacion.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  append({
                    documentType: direction === "RECEIVED" ? "SALES_INVOICE" : "PURCHASE_BILL",
                    documentId: "",
                    amount: "0.00",
                  })
                }
              >
                <Plus className="size-4" />
                Agregar aplicacion
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const documentType = allocations?.[index]?.documentType ?? "SALES_INVOICE";
                const availableDocuments = documentsByType[documentType];

                return (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-[24px] border border-emerald-950/5 bg-slate-50/70 p-4 lg:grid-cols-[180px_minmax(0,1fr)_160px_auto]"
                  >
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        {...form.register(`allocations.${index}.documentType`)}
                      >
                        {direction === "RECEIVED" ? (
                          <option value="SALES_INVOICE">Factura de venta</option>
                        ) : (
                          <>
                            <option value="PURCHASE_BILL">Factura proveedor</option>
                            <option value="EXPENSE">Gasto</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Documento</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        {...form.register(`allocations.${index}.documentId`)}
                      >
                        <option value="">Selecciona un documento</option>
                        {availableDocuments.map((document) => (
                          <option key={document.value} value={document.value}>
                            {document.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input inputMode="decimal" {...form.register(`allocations.${index}.amount`)} />
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

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Wallet className="size-4" />}
              {payment ? "Guardar borrador" : "Crear borrador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
