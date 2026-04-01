"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { postAccountingVoucherAction } from "@/modules/accounting/application/commands/accounting-core.commands";

type PostVoucherButtonProps = {
  organizationSlug: string;
  voucherId: string;
};

export function PostVoucherButton({ organizationSlug, voucherId }: PostVoucherButtonProps) {
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
            const result = await postAccountingVoucherAction(organizationSlug, voucherId);

            if (!result.success) {
              setError(result.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Postear
      </Button>
      {error ? <p className="max-w-48 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
