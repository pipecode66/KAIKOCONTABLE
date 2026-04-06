"use client";

import { LoaderCircle, Sheet } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestReportExportAction } from "@/modules/reports/application/commands/reports.commands";
import type { ReportExportRequestInput } from "@/modules/reports/dto/reports.dto";

type RequestReportExportDialogProps = {
  organizationSlug: string;
  reportKey: ReportExportRequestInput["reportKey"];
  defaultAsOf?: string;
  defaultFrom?: string;
  defaultTo?: string;
};

export function RequestReportExportDialog({
  organizationSlug,
  reportKey,
  defaultAsOf,
  defaultFrom,
  defaultTo,
}: RequestReportExportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Sheet className="size-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>Solicitar exportacion</DialogTitle>
          <DialogDescription>
            La exportacion viaja por outbox y se procesa en segundo plano para no bloquear el workspace.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 px-6 py-6"
          onSubmit={(event) => {
            event.preventDefault();
            setServerError(null);
            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await requestReportExportAction(organizationSlug, {
                reportKey,
                asOf: String(formData.get("asOf") ?? "") || undefined,
                from: String(formData.get("from") ?? "") || undefined,
                to: String(formData.get("to") ?? "") || undefined,
              });

              if (!result.success) {
                setServerError(result.message);
                return;
              }

              setOpen(false);
              router.refresh();
            });
          }}
        >
          {defaultAsOf ? (
            <div className="space-y-2">
              <Label>Fecha de corte</Label>
              <Input type="date" name="asOf" defaultValue={defaultAsOf} />
            </div>
          ) : null}

          {defaultFrom ? (
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" name="from" defaultValue={defaultFrom} />
            </div>
          ) : null}

          {defaultTo ? (
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" name="to" defaultValue={defaultTo} />
            </div>
          ) : null}

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex justify-end gap-3 border-t border-emerald-950/5 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Encolar exportacion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
