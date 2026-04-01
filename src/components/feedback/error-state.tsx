import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="rounded-[30px] border border-rose-200 bg-white/90 p-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-rose-50 text-rose-600">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mt-5 font-heading text-2xl font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
