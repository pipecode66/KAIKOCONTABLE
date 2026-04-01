"use client";

import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/modules/auth/validators/login.validator";

type LoginFormProps = {
  callbackUrl?: string;
};

function resolveSafeCallbackUrl(input?: string) {
  if (!input) {
    return "/";
  }

  return input.startsWith("/") ? input : "/";
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@kaiko.local",
      password: "KaikoDemo2026!",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: resolveSafeCallbackUrl(callbackUrl),
      });

      if (result?.error) {
        setError("No pudimos validar tus credenciales.");
        return;
      }

      window.location.assign(result?.url ?? resolveSafeCallbackUrl(callbackUrl));
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-rose-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-rose-600">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Button
        className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
        type="submit"
        disabled={isPending}
      >
        {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
        Entrar a KAIKO
      </Button>
    </form>
  );
}
