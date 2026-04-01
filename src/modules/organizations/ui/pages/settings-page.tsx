import { CalendarClock, Globe2, Landmark, SlidersHorizontal } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { FormActions } from "@/components/form/form-actions";
import { FormCard } from "@/components/form/form-card";
import { FormSection } from "@/components/form/form-section";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuracion"
        title="Parametros organizacionales base"
        description="Este sprint deja la base visual para timezone, locale, formatos, calendario fiscal y moneda base sin mezclar preocupaciones de autenticacion o negocio."
        badge="OrganizationSettings 1:1"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Timezone"
          value="America/Bogota"
          caption="Base para documentos, cierres y exportaciones."
          trendLabel="Activo"
          trend="up"
          tone="emerald"
          icon={CalendarClock}
        />
        <KpiCard
          title="Locale"
          value="es-CO"
          caption="Define formatos de UI, fechas y numeracion."
          trendLabel="Estandar"
          trend="flat"
          icon={Globe2}
        />
        <KpiCard
          title="Ano fiscal"
          value="Mes 1"
          caption="El calendario contable nace desde settings por organizacion."
          trendLabel="Jan start"
          trend="flat"
          tone="ivory"
          icon={SlidersHorizontal}
        />
        <KpiCard
          title="Moneda base"
          value="COP"
          caption="Monomoneda explicita del MVP, alineada al schema y reportes."
          trendLabel="Bloqueada tras posteo"
          trend="up"
          tone="ink"
          icon={Landmark}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <FormCard
          title="Preferencias del workspace"
          description="Formulario base listo para enchufar validaciones y mutaciones reales en los siguientes sprints."
        >
          <div className="space-y-4">
            <FormSection
              title="Contexto regional"
              hint="Los campos quedan visibles en modo lectura para mostrar el patron de formularios KAIKO."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" value="America/Bogota" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <Input id="locale" value="es-CO" disabled />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Formato y calendario"
              hint="Estos defaults luego alimentaran reportes, cierres, exportaciones y filtros de fechas."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date format</Label>
                  <Input id="dateFormat" value="dd/MM/yyyy" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Number format</Label>
                  <Input id="numberFormat" value="#,##0.00" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYearStartMonth">Fiscal year start</Label>
                  <Input id="fiscalYearStartMonth" value="1" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseCurrency">Base currency</Label>
                  <Input id="baseCurrency" value="COP" disabled />
                </div>
              </div>
            </FormSection>
          </div>

          <FormActions>
            <Button variant="outline" className="rounded-full">
              Restablecer layout
            </Button>
            <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800" disabled>
              Guardar cambios pronto
            </Button>
          </FormActions>
        </FormCard>

        <BaseDataTable
          title="Controles activos"
          description="Resumen rapido de las politicas estructurales visibles desde configuracion."
          rows={[
            {
              control: "OrganizationSettings 1:1",
              detail: "Cada organizacion nace con configuracion operativa obligatoria.",
              state: "active",
            },
            {
              control: "Base currency",
              detail: "No se debera cambiar despues de movimientos posteados.",
              state: "locked",
            },
            {
              control: "Precision decimal",
              detail: "Dinero y montos usan Decimal(18,2); tasas Decimal(7,4).",
              state: "posted",
            },
            {
              control: "Period logic",
              detail: "Cierres y bloqueos consumiran estos ajustes del tenant.",
              state: "pending",
            },
          ]}
          columns={[
            { key: "control", title: "Control" },
            { key: "detail", title: "Detalle" },
            {
              key: "state",
              title: "Estado",
              render: (row) => <StatusPill status={row.state as "active" | "locked" | "posted" | "pending"} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
