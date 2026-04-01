import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDefaultOrganizationSlug } from "@/modules/organizations/application/queries/get-default-organization-slug";
import { ForgotPasswordForm } from "@/modules/auth/ui/forms/forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user?.id) {
    const slug = await getDefaultOrganizationSlug(session.user.id);
    redirect(slug ? `/${slug}/dashboard` : "/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">Recuperacion</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950">
          Restablece tu acceso
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          El flujo ya escribe tokens reales en base de datos, respeta expiracion y deja la entrega del correo desacoplada de la request.
        </p>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>

        <Link href="/login" className="mt-6 inline-block text-sm text-emerald-700">
          Volver a iniciar sesion
        </Link>
      </div>
    </main>
  );
}
