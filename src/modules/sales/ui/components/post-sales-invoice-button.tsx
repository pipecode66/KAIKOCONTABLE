"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { postSalesInvoiceAction } from "@/modules/sales/application/commands/sales-invoice.commands";

type PostSalesInvoiceButtonProps = {
  organizationSlug: string;
  invoiceId: string;
};

export function PostSalesInvoiceButton({
  organizationSlug,
  invoiceId,
}: PostSalesInvoiceButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await postSalesInvoiceAction(organizationSlug, invoiceId);

            if (!result.success) {
              setError(result.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Publicar
      </Button>
      {error ? <p className="max-w-56 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
