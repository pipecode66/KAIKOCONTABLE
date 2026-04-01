"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";

export default function OrganizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-6">
      <ErrorState
        title="No pudimos cargar el workspace"
        description="La base visual del modulo sigue intacta, pero esta vista encontro un fallo inesperado. Puedes volver a intentarlo sin perder contexto."
        action={
          <Button
            className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={() => reset()}
          >
            Reintentar
          </Button>
        }
      />
    </div>
  );
}
