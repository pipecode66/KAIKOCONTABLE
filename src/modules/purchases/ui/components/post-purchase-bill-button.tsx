"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { postPurchaseBillAction } from "@/modules/purchases/application/commands/purchase-bill.commands";

type PostPurchaseBillButtonProps = {
  organizationSlug: string;
  billId: string;
};

export function PostPurchaseBillButton({
  organizationSlug,
  billId,
}: PostPurchaseBillButtonProps) {
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
            const result = await postPurchaseBillAction(organizationSlug, billId);

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
