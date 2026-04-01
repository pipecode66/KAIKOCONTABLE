import { Building2, Globe2, Landmark, UsersRound } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationForm } from "@/modules/organizations/ui/forms/create-organization-form";

type OrganizationDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  roleName: string;
  locale: string;
  timezone: string;
  currencyCode: string;
  lastAccessedAt: string;
  isActive: boolean;
};

type OrganizationMemberItem = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  status: "active" | "inactive" | "pending";
  lastAccessedAt: string;
};

type CurrencyOption = {
  id: string;
  code: string;
  name: string;
};

type OrganizationsOverviewPageProps = {
  activeOrganizationSlug: string;
  organizationName: string;
  canManageOrganizations: boolean;
  organizations: OrganizationDirectoryItem[];
  memberships: OrganizationMemberItem[];
  currencies: CurrencyOption[];
  defaultSettings: {
    timezone: string;
    locale: string;
    fiscalYearStartMonth: number;
    numberFormat: string;
    dateFormat: string;
  };
};

export function OrganizationsOverviewPage({
  activeOrganizationSlug,
  organizationName,
  canManageOrganizations,
  organizations,
  memberships,
  currencies,
  defaultSettings,
}: OrganizationsOverviewPageProps) {
  const activeOrganization =
    organizations.find((organization) => organization.slug === activeOrganizationSlug) ??
    organizations[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organizaciones"
        title="Acceso multiempresa conectado a datos reales"
        description="Aqui viven la organizacion activa, el directorio de workspaces accesibles y el flujo transaccional de alta de tenants con OrganizationSettings y baseCurrencyId."
        badge={organizationName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Workspaces accesibles"
          value={String(organizations.length)}
          caption="Directorios reales segun memberships activas del usuario autenticado."
          trendLabel="Real data"
          trend="up"
          tone="emerald"
          icon={Building2}
        />
        <KpiCard
          title="Organizacion activa"
          value={activeOrganization?.name ?? "Sin acceso"}
          caption="La resolucion por slug valida membership activa y organizationId en servidor."
          trendLabel={activeOrganization?.roleName ?? "N/D"}
          trend="flat"
          icon={UsersRound}
        />
        <KpiCard
          title="Locale / timezone"
          value={activeOrganization ? `${activeOrganization.locale}` : "es-CO"}
          caption="Los settings del tenant ya gobiernan fechas, reportes y exportaciones."
          trendLabel={activeOrganization?.timezone ?? defaultSettings.timezone}
          trend="flat"
          tone="ivory"
          icon={Globe2}
        />
        <KpiCard
          title="Moneda base"
          value={activeOrganization?.currencyCode ?? "COP"}
          caption="El MVP opera en la moneda base explicita de cada organizacion."
          trendLabel="baseCurrencyId"
          trend="up"
          tone="ink"
          icon={Landmark}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <BaseDataTable
          title="Mis organizaciones"
          description="Lista real de workspaces disponibles para la sesion actual, con rol y contexto regional."
          rows={organizations}
          columns={[
            { key: "name", title: "Organizacion" },
            { key: "roleName", title: "Mi rol" },
            { key: "locale", title: "Locale" },
            { key: "timezone", title: "Timezone" },
            { key: "currencyCode", title: "Moneda" },
            {
              key: "isActive",
              title: "Estado",
              render: (row) => <StatusPill status={row.isActive ? "active" : "inactive"} />,
            },
          ]}
        />

        {canManageOrganizations ? (
          <CreateOrganizationForm
            currentOrganizationSlug={activeOrganizationSlug}
            currencies={currencies}
            defaultSettings={defaultSettings}
          />
        ) : (
          <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Permiso requerido</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-600">
              Puedes consultar tus organizaciones accesibles, pero crear nuevos tenants requiere
              `organizations.manage` o `admin.manage`.
            </CardContent>
          </Card>
        )}
      </div>

      {canManageOrganizations ? (
        <BaseDataTable
          title="Miembros de la organizacion activa"
          description="Memberships reales del tenant actual con rol asignado y ultima actividad conocida."
          rows={memberships}
          emptyState={
            <EmptyState
              title="Aun no hay miembros adicionales"
              description="La organizacion activa solo tiene al usuario creador o las memberships todavia no se han ampliado."
            />
          }
          columns={[
            { key: "name", title: "Usuario" },
            { key: "email", title: "Correo" },
            { key: "roleName", title: "Rol" },
            { key: "lastAccessedAt", title: "Ultimo acceso" },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status} />,
            },
          ]}
        />
      ) : null}
    </div>
  );
}
