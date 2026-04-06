"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";

export default function ReportsError({
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
        title="No pudimos cargar Reportes"
        description="La capa de consulta encontró un fallo inesperado. Puedes reintentar sin salir del workspace."
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
