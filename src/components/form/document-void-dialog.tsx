"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";

const documentVoidSchema = z.object({
  reason: z.string().trim().min(6, "Explica el motivo de la anulacion.").max(400),
});

type DocumentVoidDialogProps = {
  title: string;
  description: string;
  triggerLabel?: string;
  resourceId: string;
  idempotencyKey: string;
  onSubmit: (payload: { reason: string; idempotencyKey: string }) => Promise<{
    success: boolean;
    message: string;
  }>;
};

export function DocumentVoidDialog({
  title,
  description,
  triggerLabel = "Anular",
  resourceId,
  idempotencyKey,
  onSubmit,
}: DocumentVoidDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof documentVoidSchema>>({
    resolver: zodResolver(documentVoidSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await onSubmit({
        reason: values.reason,
        idempotencyKey,
      });

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`void-reason-${resourceId}`}>Motivo</Label>
            <Textarea
              id={`void-reason-${resourceId}`}
              rows={5}
              placeholder="Describe brevemente el motivo operativo."
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? (
              <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Idempotency key</Label>
            <Input readOnly value={idempotencyKey} />
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-rose-700 text-white hover:bg-rose-800">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Confirmar anulacion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
