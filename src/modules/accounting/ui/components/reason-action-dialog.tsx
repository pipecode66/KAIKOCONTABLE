"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  journalReversalSchema,
  type JournalReversalInput,
} from "@/modules/accounting/validators/journal-reversal.validator";
import {
  voucherVoidSchema,
  type VoucherVoidValues,
} from "@/modules/accounting/validators/manual-voucher-form.validator";

type ReasonActionDialogProps =
  | {
      kind: "reverse";
      title: string;
      description: string;
      triggerLabel: string;
      triggerVariant?: "default" | "outline" | "destructive";
      defaultReason?: string;
      onSubmit: (payload: JournalReversalInput) => Promise<{ success: boolean; message: string }>;
      resourceId: string;
    }
  | {
      kind: "void";
      title: string;
      description: string;
      triggerLabel: string;
      triggerVariant?: "default" | "outline" | "destructive";
      defaultReason?: string;
      onSubmit: (payload: VoucherVoidValues) => Promise<{ success: boolean; message: string }>;
      resourceId: string;
      version: number;
    };

export function ReasonActionDialog(props: ReasonActionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<{ reason: string }>({
    resolver: zodResolver(
      props.kind === "reverse"
        ? journalReversalSchema.pick({ reason: true })
        : voucherVoidSchema.pick({ reason: true }),
    ),
    defaultValues: {
      reason: props.defaultReason ?? "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const basePayload = {
        reason: values.reason,
        idempotencyKey: `${props.kind}:${props.resourceId}`,
      };

      const result =
        props.kind === "reverse"
          ? await props.onSubmit({
              journalEntryId: props.resourceId,
              ...basePayload,
            })
          : await props.onSubmit({
              voucherId: props.resourceId,
              version: props.version,
              ...basePayload,
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
        <Button size="sm" variant={props.triggerVariant ?? "outline"} className="rounded-full">
          {props.triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-emerald-950/10 bg-white p-0">
        <DialogHeader className="border-b border-emerald-950/5 px-6 py-5">
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
          <input type="hidden" value={props.resourceId} readOnly />
          <div className="space-y-2">
            <Label htmlFor={`${props.kind}-reason-${props.resourceId}`}>Motivo</Label>
            <Textarea
              id={`${props.kind}-reason-${props.resourceId}`}
              rows={5}
              placeholder="Explica brevemente el motivo operativo."
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? (
              <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Llave de idempotencia</Label>
            <Input readOnly value={`${props.kind}:${props.resourceId}`} />
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-950/5 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
