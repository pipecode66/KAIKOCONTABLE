import { KeyRound, ShieldCheck, UserCog, UsersRound } from "lucide-react";

import { BaseDataTable } from "@/components/data-table/base-data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { KpiCard } from "@/components/layout/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminRoleItem = {
  id: string;
  key: string;
  name: string;
  scope: "system" | "organization";
  permissionCount: number;
  membershipCount: number;
};

type AdminPermissionItem = {
  id: string;
  code: string;
  module: string;
  action: string;
  scope: "system" | "organization";
};

type AdminMembershipItem = {
  id: string;
  userName: string;
  userEmail: string;
  roleName: string;
  status: "active" | "inactive" | "pending";
};

type AdminOverviewPageProps = {
  organizationName: string;
  canManageAdmin: boolean;
  roles: AdminRoleItem[];
  permissions: AdminPermissionItem[];
  memberships: AdminMembershipItem[];
};

export function AdminOverviewPage({
  organizationName,
  canManageAdmin,
  roles,
  permissions,
  memberships,
}: AdminOverviewPageProps) {
  if (!canManageAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Gobierno de acceso y permisos"
          description="La pagina ya esta conectada a backend real, pero esta sesion no tiene permisos para administrar seguridad en la organizacion activa."
          badge={organizationName}
        />

        <Card className="rounded-[30px] border-emerald-950/5 bg-white/94 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            Para ver roles, permisos y memberships del tenant necesitas `admin.manage` o
            `organizations.manage`.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Roles, permisos y memberships reales"
        description="Esta vista ya consume datos reales de Role, Permission, RolePermission y Membership para la organizacion activa."
        badge={organizationName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Roles visibles"
          value={String(roles.length)}
          caption="Incluye roles de sistema y, si aparecen despues, roles especificos del tenant."
          trendLabel="RBAC"
          trend="up"
          tone="emerald"
          icon={ShieldCheck}
        />
        <KpiCard
          title="Permisos"
          value={String(permissions.length)}
          caption="Catalogo real de acciones que luego se validan en backend."
          trendLabel="Server enforced"
          trend="up"
          icon={KeyRound}
        />
        <KpiCard
          title="Memberships activas"
          value={String(memberships.length)}
          caption="Usuarios con acceso vigente a la organizacion seleccionada."
          trendLabel="Tenant scoped"
          trend="flat"
          tone="ivory"
          icon={UsersRound}
        />
        <KpiCard
          title="Roles usados"
          value={String(new Set(memberships.map((membership) => membership.roleName)).size)}
          caption="Mezcla actual de perfiles dentro del tenant activo."
          trendLabel="Roles activos"
          trend="flat"
          tone="ink"
          icon={UserCog}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <BaseDataTable
          title="Roles y cobertura"
          description="Lectura real de roles disponibles, cantidad de permisos y membresias asociadas."
          rows={roles}
          columns={[
            { key: "name", title: "Rol" },
            { key: "key", title: "Key" },
            { key: "permissionCount", title: "Permisos" },
            { key: "membershipCount", title: "Members" },
            {
              key: "scope",
              title: "Scope",
              render: (row) => (
                <StatusPill status={row.scope === "system" ? "posted" : "active"} />
              ),
            },
          ]}
        />

        <BaseDataTable
          title="Memberships activas"
          description="Usuarios reales del tenant actual con su rol principal."
          rows={memberships}
          emptyState={
            <EmptyState
              title="Sin memberships activas"
              description="Cuando existan mas usuarios asignados, apareceran aqui con su rol y estado."
            />
          }
          columns={[
            { key: "userName", title: "Usuario" },
            { key: "userEmail", title: "Correo" },
            { key: "roleName", title: "Rol" },
            {
              key: "status",
              title: "Estado",
              render: (row) => <StatusPill status={row.status} />,
            },
          ]}
        />
      </div>

      <BaseDataTable
        title="Catalogo de permisos"
        description="Permisos reales disponibles para el tenant activo y el sistema base."
        rows={permissions}
        columns={[
          { key: "code", title: "Codigo" },
          { key: "module", title: "Modulo" },
          { key: "action", title: "Accion" },
          {
            key: "scope",
            title: "Scope",
            render: (row) => <StatusPill status={row.scope === "system" ? "posted" : "active"} />,
          },
        ]}
      />
    </div>
  );
}
