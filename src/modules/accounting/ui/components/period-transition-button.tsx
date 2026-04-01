"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { transitionAccountingPeriodAction } from "@/modules/accounting/application/commands/accounting-core.commands";

type PeriodTransitionButtonProps = {
  organizationSlug: string;
  periodId: string;
  action: "close" | "reopen" | "lock";
};

const labels = {
  close: "Cerrar",
  reopen: "Reabrir",
  lock: "Bloquear",
} as const;

export function PeriodTransitionButton({
  organizationSlug,
  periodId,
  action,
}: PeriodTransitionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={action === "close" ? "default" : "outline"}
        size="sm"
        className={action === "close" ? "bg-emerald-700 text-white hover:bg-emerald-800" : "rounded-full"}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await transitionAccountingPeriodAction(organizationSlug, action, {
              periodId,
            });

            if (!result.success) {
              setError(result.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {labels[action]}
      </Button>
      {error ? <p className="max-w-48 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
