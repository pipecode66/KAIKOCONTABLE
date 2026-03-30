import Link from "next/link";

import { LoginForm } from "@/modules/auth/ui/forms/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(15,135,95,0.22),_transparent_30%),linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[40px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-[#071510] p-10 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">KAIKO</p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight">
            Un acceso claro a tu operación financiera.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/75">
            Inicia sesión con tu cuenta para entrar al workspace multiempresa, consultar reportes y operar sobre una base contable trazable.
          </p>
          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-emerald-100/80">Credenciales demo</p>
            <p className="mt-3 text-sm">admin@kaiko.local</p>
            <p className="text-sm">KaikoDemo2026!</p>
          </div>
        </section>
        <section className="p-10">
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-700/60">Acceso seguro</p>
            <h2 className="mt-4 font-heading text-3xl font-semibold text-slate-950">Bienvenido de nuevo</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Auth.js v5, sesiones persistidas, cookies httpOnly y autorización backend por organización.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <Link href="/forgot-password" className="text-emerald-700 hover:text-emerald-900">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link href="/" className="hover:text-slate-800">
                Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
