import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormCard({ title, description, children, className }: FormCardProps) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-emerald-950/5 bg-white/92 p-6 shadow-[0_18px_42px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="mb-5">
        <h3 className="font-heading text-2xl font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
