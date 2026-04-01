"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, PencilLine, Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ledgerAccountTypeOptions,
  normalBalanceOptions,
  type LedgerAccountFormInput,
  type LedgerAccountListItemDto,
  type LedgerAccountParentOptionDto,
} from "@/modules/accounting/dto/ledger-account.dto";
import { saveLedgerAccountAction } from "@/modules/accounting/application/commands/ledger-account.commands";
import { ledgerAccountFormSchema } from "@/modules/accounting/validators/ledger-account-form.validator";

type LedgerAccountFormDialogProps = {
  organizationSlug: string;
  parentOptions: LedgerAccountParentOptionDto[];
  account?: LedgerAccountListItemDto;
};

function getDefaultValues(account?: LedgerAccountListItemDto): LedgerAccountFormInput {
  return {
    id: account?.id,
    code: account?.code ?? "",
    name: account?.name ?? "",
    description: account?.description ?? "",
    type: account?.type ?? "ASSET",
    normalBalance: account?.normalBalance ?? "DEBIT",
    parentId: account?.parentId ?? undefined,
    isPosting: account?.isPosting ?? true,
    allowManualEntries: account?.allowManualEntries ?? true,
  };
}

export function LedgerAccountFormDialog({
  organizationSlug,
  parentOptions,
  account,
}: LedgerAccountFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LedgerAccountFormInput>({
    resolver: zodResolver(ledgerAccountFormSchema),
    defaultValues: getDefaultValues(account),
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const isPosting = useWatch({ control: form.control, name: "isPosting" });

  useEffect(() => {
    form.reset(getDefaultValues(account));
  }, [account, form, isOpen]);

  useEffect(() => {
    if (!isPosting) {
      form.setValue("allowManualEntries", false, {
        shouldDirty: true,
      });
    }
  }, [form, isPosting]);

  const availableParentOptions = useMemo(
    () =>
      parentOptions.filter(
        (option) => option.type === selectedType && option.id !== account?.id,
      ),
    [account?.id, parentOptions, selectedType],
  );

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await saveLedgerAccountAction(organizationSlug, values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [fieldName, messages] of Object.entries(result.fieldErrors)) {
            if (!messages?.length) {
              continue;
            }

            form.setError(fieldName as keyof LedgerAccountFormInput, {
              type: "server",
              message: messages[0],
            });
          }
        }

        setServerError(result.message);
        return;
      }

      setIsOpen(false);
      form.reset(getDefaultValues(account));
      router.refresh();
    });
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {account ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 px-4 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nueva cuenta
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{account ? "Editar cuenta contable" : "Crear cuenta contable"}</DialogTitle>
          <DialogDescription>
            Define codigo, naturaleza, jerarquia y si la cuenta admite movimientos manuales.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`ledger-code-${account?.id ?? "new"}`}>Codigo</Label>
              <Input
                id={`ledger-code-${account?.id ?? "new"}`}
                placeholder="Ej. 1105"
                {...form.register("code")}
              />
              {form.formState.errors.code ? (
                <p className="text-sm text-rose-600">{form.formState.errors.code.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ledger-name-${account?.id ?? "new"}`}>Nombre</Label>
              <Input
                id={`ledger-name-${account?.id ?? "new"}`}
                placeholder="Ej. Caja general"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-rose-600">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`ledger-description-${account?.id ?? "new"}`}>Descripcion</Label>
            <Textarea
              id={`ledger-description-${account?.id ?? "new"}`}
              placeholder="Contexto operativo o uso sugerido."
              rows={4}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-rose-600">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("parentId", undefined, { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ledgerAccountTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type ? (
                <p className="text-sm text-rose-600">{form.formState.errors.type.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Balance normal</Label>
              <Controller
                control={form.control}
                name="normalBalance"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder="Selecciona el balance" />
                    </SelectTrigger>
                    <SelectContent>
                      {normalBalanceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.normalBalance ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.normalBalance.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Cuenta padre</Label>
              <Controller
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                  >
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder="Sin jerarquia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin jerarquia</SelectItem>
                      {availableParentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.code} - {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.parentId ? (
                <p className="text-sm text-rose-600">{form.formState.errors.parentId.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-emerald-950/5 bg-emerald-50/50 p-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Controller
                control={form.control}
                name="isPosting"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-1"
                  />
                )}
              />
              <div>
                <Label className="text-sm font-medium text-slate-900">Cuenta de posteo</Label>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Permite imputar movimientos directamente en esta cuenta.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Controller
                control={form.control}
                name="allowManualEntries"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    disabled={!isPosting}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-1"
                  />
                )}
              />
              <div>
                <Label className="text-sm font-medium text-slate-900">Permitir ajustes manuales</Label>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Solo aplica para cuentas de posteo activas.
                </p>
              </div>
            </div>
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {account ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
