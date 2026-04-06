"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { postTransferAction } from "@/modules/treasury/application/commands/treasury.commands";

type PostTransferButtonProps = {
  organizationSlug: string;
  transferId: string;
};

export function PostTransferButton({ organizationSlug, transferId }: PostTransferButtonProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setServerError(null);
            const result = await postTransferAction(organizationSlug, transferId);
            if (!result.success) {
              setServerError(result.message);
              return;
            }

            router.refresh();
          })
        }
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Postear
      </Button>
      {serverError ? <p className="text-xs text-rose-600">{serverError}</p> : null}
    </div>
  );
}
