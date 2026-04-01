"use client";

import { useEffect, useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createOrganizationAction,
  type CreateOrganizationActionState,
} from "@/modules/organizations/application/commands/organization.commands";
import { FormActions } from "@/components/form/form-actions";
import { FormCard } from "@/components/form/form-card";
import { FormSection } from "@/components/form/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: CreateOrganizationActionState = {
  success: false,
  message: "",
};

type CreateOrganizationFormProps = {
  currentOrganizationSlug: string;
  currencies: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  defaultSettings: {
    timezone: string;
    locale: string;
    fiscalYearStartMonth: number;
    numberFormat: string;
    dateFormat: string;
  };
};

function FieldError(props: { errors?: string[] }) {
  if (!props.errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{props.errors[0]}</p>;
}

export function CreateOrganizationForm({
  currentOrganizationSlug,
  currencies,
  defaultSettings,
}: CreateOrganizationFormProps) {
  const router = useRouter();
  const boundAction = createOrganizationAction.bind(null, currentOrganizationSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  return (
    <FormCard
      title="Crear nueva organizacion"
      description="Flujo real en una sola transaccion: Organization + OrganizationSettings + baseCurrencyId + membership del creador."
      className="h-full"
    >
      <form action={formAction} className="space-y-4">
        <FormSection
          title="Identidad del tenant"
          hint="Este formulario ya escribe contra backend real y respeta permisos por organizacion."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre comercial</Label>
              <Input id="name" name="name" placeholder="KAIKO Labs" />
              <FieldError errors={state.fieldErrors?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" placeholder="kaiko-labs" />
              <FieldError errors={state.fieldErrors?.slug} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Razon social</Label>
              <Input id="legalName" name="legalName" placeholder="KAIKO Labs SAS" />
              <FieldError errors={state.fieldErrors?.legalName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">NIT</Label>
              <Input id="taxId" name="taxId" placeholder="901234567-8" />
              <FieldError errors={state.fieldErrors?.taxId} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Configuracion operativa"
          hint="Se crea desacoplada de autenticacion y alineada con locale, formatos y calendario fiscal."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseCurrencyId">Moneda base</Label>
              <Select name="baseCurrencyId" defaultValue={currencies[0]?.id}>
                <SelectTrigger id="baseCurrencyId">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.baseCurrencyId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue={defaultSettings.timezone} />
              <FieldError errors={state.fieldErrors?.timezone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" name="locale" defaultValue={defaultSettings.locale} />
              <FieldError errors={state.fieldErrors?.locale} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalYearStartMonth">Inicio fiscal</Label>
              <Input
                id="fiscalYearStartMonth"
                name="fiscalYearStartMonth"
                type="number"
                min={1}
                max={12}
                defaultValue={defaultSettings.fiscalYearStartMonth}
              />
              <FieldError errors={state.fieldErrors?.fiscalYearStartMonth} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date format</Label>
              <Input id="dateFormat" name="dateFormat" defaultValue={defaultSettings.dateFormat} />
              <FieldError errors={state.fieldErrors?.dateFormat} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number format</Label>
              <Input
                id="numberFormat"
                name="numberFormat"
                defaultValue={defaultSettings.numberFormat}
              />
              <FieldError errors={state.fieldErrors?.numberFormat} />
            </div>
          </div>
        </FormSection>

        {state.message ? (
          <div
            className={
              state.success
                ? "rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            }
          >
            {state.message}
          </div>
        ) : null}

        <FormActions>
          <Button type="submit" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={pending}>
            {pending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
            Crear organizacion
          </Button>
        </FormActions>
      </form>
    </FormCard>
  );
}
