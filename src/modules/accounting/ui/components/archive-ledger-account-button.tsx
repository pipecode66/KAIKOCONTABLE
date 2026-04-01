"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveLedgerAccountAction } from "@/modules/accounting/application/commands/ledger-account.commands";

type ArchiveLedgerAccountButtonProps = {
  organizationSlug: string;
  accountId: string;
  accountCode: string;
  accountName: string;
};

export function ArchiveLedgerAccountButton({
  organizationSlug,
  accountId,
  accountCode,
  accountName,
}: ArchiveLedgerAccountButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full text-rose-700 hover:text-rose-800">
          <Trash2 className="size-4" />
          Archivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[28px] border border-emerald-950/10 bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Archivar cuenta contable</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a archivar la cuenta {accountCode} - {accountName}. Solo continuaremos si no
            tiene movimientos ni dependencias activas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={(event) => {
              event.preventDefault();
              setError(null);

              startTransition(async () => {
                const result = await archiveLedgerAccountAction(organizationSlug, accountId);

                if (!result.success) {
                  setError(result.message);
                  return;
                }

                router.refresh();
              });
            }}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Confirmar archivo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
