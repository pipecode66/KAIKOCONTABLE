"use client";

import { useActionState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";

import { requestPasswordResetAction } from "@/modules/auth/application/commands/auth.commands";
import type { PasswordResetActionState } from "@/modules/auth/dto/password-reset.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PasswordResetActionState = {
  success: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="tu@empresa.co" />
        {state.fieldErrors?.email?.length ? (
          <p className="text-sm text-rose-600">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div
          className={
            state.success
              ? "rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
        >
          <div className="flex items-start gap-2">
            {state.success ? <MailCheck className="mt-0.5 size-4" /> : null}
            <div>
              <p>{state.message}</p>
              {state.debugResetUrl ? (
                <a
                  className="mt-2 inline-block break-all text-emerald-700 underline underline-offset-4"
                  href={state.debugResetUrl}
                >
                  {state.debugResetUrl}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
        disabled={pending}
      >
        {pending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
        Solicitar enlace de recuperacion
      </Button>
    </form>
  );
}
