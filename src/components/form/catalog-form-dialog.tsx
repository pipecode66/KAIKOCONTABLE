"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LoaderCircle, PencilLine, Plus } from "lucide-react";

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
import type {
  CatalogActionResult,
  CatalogSelectOption,
} from "@/modules/shared/dto/catalog-management.dto";

type CatalogFieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "date" | "number";
  options?: CatalogSelectOption[];
  placeholder?: string;
  description?: string;
};

type CatalogFormDialogProps = {
  title: string;
  description: string;
  fields: CatalogFieldConfig[];
  initialValues?: Record<string, string | boolean | null | undefined>;
  action: (
    state: CatalogActionResult,
    formData: FormData,
  ) => Promise<CatalogActionResult>;
};

const initialState: CatalogActionResult = {
  success: false,
  message: "",
};

export function CatalogFormDialog({
  title,
  description,
  fields,
  initialValues,
  action,
}: CatalogFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const isEditing = Boolean(initialValues?.id);

  useEffect(() => {
    if (state.success) {
      const timeoutId = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [state.success]);

  const defaultValues = useMemo(() => initialValues ?? {}, [initialValues]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline" size="sm" className="rounded-full">
            <PencilLine className="size-4" />
            Editar
          </Button>
        ) : (
          <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus className="size-4" />
            Nuevo registro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 px-6 py-6">
          {defaultValues.id ? <input type="hidden" name="id" value={String(defaultValues.id)} /> : null}

          {fields.map((field) => {
            const error = state.fieldErrors?.[field.name]?.[0];
            const defaultValue = defaultValues[field.name];

            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`${field.name}-${isEditing ? defaultValues.id : "new"}`}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`${field.name}-${isEditing ? defaultValues.id : "new"}`}
                    name={field.name}
                    defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
                    placeholder={field.placeholder}
                    rows={4}
                  />
                ) : null}
                {field.type === "select" ? (
                  <select
                    id={`${field.name}-${isEditing ? defaultValues.id : "new"}`}
                    name={field.name}
                    defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecciona una opcion</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                {field.type === "checkbox" ? (
                  <label className="inline-flex items-center gap-3 rounded-xl border border-emerald-950/5 bg-emerald-50/70 px-3 py-3 text-sm text-slate-700">
                    <input
                      id={`${field.name}-${isEditing ? defaultValues.id : "new"}`}
                      name={field.name}
                      type="checkbox"
                      defaultChecked={Boolean(defaultValue)}
                      className="size-4 rounded border-slate-300 text-emerald-700"
                    />
                    {field.description ?? field.placeholder ?? field.label}
                  </label>
                ) : null}
                {field.type !== "textarea" && field.type !== "select" && field.type !== "checkbox" ? (
                  <Input
                    id={`${field.name}-${isEditing ? defaultValues.id : "new"}`}
                    name={field.name}
                    type={field.type === "number" ? "number" : field.type}
                    step={field.type === "number" ? "0.0001" : undefined}
                    defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
                    placeholder={field.placeholder}
                  />
                ) : null}
                {field.description && field.type !== "checkbox" ? (
                  <p className="text-xs leading-5 text-slate-500">{field.description}</p>
                ) : null}
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              </div>
            );
          })}

          {state.message && !state.success ? <p className="text-sm text-rose-600">{state.message}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isEditing ? "Guardar cambios" : "Crear registro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { CatalogFieldConfig };
