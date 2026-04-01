"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { resetPasswordAction } from "@/modules/auth/application/commands/auth.commands";
import type { PasswordResetActionState } from "@/modules/auth/dto/password-reset.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PasswordResetActionState = {
  success: false,
  message: "",
};

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contrasena</Label>
        <Input id="password" name="password" type="password" />
        {state.fieldErrors?.password?.length ? (
          <p className="text-sm text-rose-600">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" />
        {state.fieldErrors?.confirmPassword?.length ? (
          <p className="text-sm text-rose-600">{state.fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
        disabled={pending}
      >
        {pending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
        Guardar nueva contrasena
      </Button>
    </form>
  );
}
