"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReconciliationSuggestionDto } from "@/modules/treasury/dto/treasury.dto";
import { completeReconciliationAction } from "@/modules/treasury/application/commands/treasury.commands";

type CompleteReconciliationDialogProps = {
  organizationSlug: string;
  reconciliationId: string;
  suggestions: ReconciliationSuggestionDto[];
};

export function CompleteReconciliationDialog({
  organizationSlug,
  reconciliationId,
  suggestions,
}: CompleteReconciliationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Sparkles className="size-4" />
          Aplicar sugerencias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>Conciliacion asistida</DialogTitle>
          <DialogDescription>
            Se aplicaran las coincidencias sugeridas con mejor score de monto y fecha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.bankStatementLineId} className="rounded-[22px] border border-slate-100 bg-slate-50/75 p-4">
                <p className="font-medium text-slate-950">{suggestion.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {suggestion.transactionDateIso.slice(0, 10)} · {suggestion.amount}
                </p>
                <p className="mt-2 text-sm text-slate-700">{suggestion.matchedDocumentLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{suggestion.notes}</p>
              </div>
            ))}
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() =>
                startTransition(async () => {
                  setServerError(null);
                  const result = await completeReconciliationAction(organizationSlug, {
                    reconciliationId,
                    selections: suggestions.map((suggestion) => ({
                      bankStatementLineId: suggestion.bankStatementLineId,
                      matchedDocumentType: suggestion.matchedDocumentType,
                      matchedDocumentId: suggestion.matchedDocumentId,
                      matchedAmount: suggestion.matchedAmount,
                      notes: suggestion.notes ?? "",
                    })),
                  });

                  if (!result.success) {
                    setServerError(result.message);
                    return;
                  }

                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Confirmar conciliacion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
