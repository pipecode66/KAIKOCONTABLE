import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
} from "lucide-react";

export type WorkspaceNavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  {
    href: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    description: "Pulso financiero diario",
    icon: LayoutDashboard,
  },
  {
    href: "organizations",
    label: "Organizaciones",
    shortLabel: "Organizaciones",
    description: "Multiempresa y accesos",
    icon: Building2,
  },
  {
    href: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description: "Roles, permisos y gobierno",
    icon: ShieldCheck,
  },
  {
    href: "sales",
    label: "Ventas",
    shortLabel: "Ventas",
    description: "Facturacion y CxC",
    icon: CreditCard,
  },
  {
    href: "purchases",
    label: "Compras",
    shortLabel: "Compras",
    description: "Gastos y CxP",
    icon: BookOpen,
  },
  {
    href: "accounting",
    label: "Contabilidad",
    shortLabel: "Contabilidad",
    description: "Motor contable y catalogos",
    icon: BookOpen,
  },
  {
    href: "treasury",
    label: "Tesoreria",
    shortLabel: "Tesoreria",
    description: "Caja, bancos y conciliacion",
    icon: Landmark,
  },
  {
    href: "reports",
    label: "Reportes",
    shortLabel: "Reportes",
    description: "Lecturas financieras",
    icon: BarChart3,
  },
  {
    href: "settings",
    label: "Configuracion",
    shortLabel: "Configuracion",
    description: "Parametros organizacionales",
    icon: Settings2,
  },
];

export const workspaceRouteLabelMap = new Map(
  workspaceNavigation.map((item) => [item.href, item.shortLabel]),
);
