import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">Recuperación</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950">
          Restablece tu acceso
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          La base del proyecto ya contempla tokens, jobs de correo y políticas de expiración para recuperación de contraseña.
        </p>
        <form className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" placeholder="tu@empresa.co" />
          </div>
          <Button type="button" className="w-full">
            Solicitar enlace de recuperación
          </Button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm text-emerald-700">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
