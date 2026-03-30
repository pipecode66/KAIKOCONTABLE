import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">Nueva contraseña</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950">
          Define tu nueva credencial
        </h1>
        <form className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button type="button" className="w-full">
            Guardar contraseña
          </Button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm text-emerald-700">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
