"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, Archive } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type CatalogArchiveButtonProps = {
  onArchive: () => Promise<{ success: boolean; message: string }>;
};

export function CatalogArchiveButton({ onArchive }: CatalogArchiveButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await onArchive();
            if (!result.success) {
              setError(result.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Archive className="size-4" />}
        Archivar
      </Button>
      {error ? <p className="max-w-48 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
