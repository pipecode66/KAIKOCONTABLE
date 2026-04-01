import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function FormSection({ title, hint, children }: FormSectionProps) {
  return (
    <div className="space-y-4 rounded-[24px] border border-emerald-950/5 bg-emerald-50/45 p-4">
      <div>
        <h4 className="font-medium text-slate-900">{title}</h4>
        {hint ? <p className="mt-1 text-sm leading-6 text-slate-600">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
