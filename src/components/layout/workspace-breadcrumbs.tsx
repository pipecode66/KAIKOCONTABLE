"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { workspaceRouteLabelMap } from "@/components/layout/workspace-navigation";

type WorkspaceBreadcrumbsProps = {
  organizationSlug: string;
  organizationName: string;
};

export function WorkspaceBreadcrumbs({
  organizationSlug,
  organizationName,
}: WorkspaceBreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const moduleSegments = segments.slice(1);

  const breadcrumbs = [
    {
      href: `/${organizationSlug}/dashboard`,
      label: organizationName,
      current: moduleSegments.length === 0,
    },
    ...moduleSegments.map((segment, index) => ({
      href: `/${organizationSlug}/${moduleSegments.slice(0, index + 1).join("/")}`,
      label: workspaceRouteLabelMap.get(segment) ?? segment,
      current: index === moduleSegments.length - 1,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-4 text-slate-300" /> : null}
          {item.current ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
