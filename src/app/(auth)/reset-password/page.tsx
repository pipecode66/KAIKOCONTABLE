import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDefaultOrganizationSlug } from "@/modules/organizations/application/queries/get-default-organization-slug";
import { ErrorState } from "@/components/feedback/error-state";
import { ResetPasswordForm } from "@/modules/auth/ui/forms/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();

  if (session?.user?.id) {
    const slug = await getDefaultOrganizationSlug(session.user.id);
    redirect(slug ? `/${slug}/dashboard` : "/");
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
        <div className="w-full max-w-2xl">
          <ErrorState
            title="Falta el token de recuperacion"
            description="Abre el enlace completo que recibiste por correo o genera un nuevo enlace de recuperacion."
            action={
              <Link
                href="/forgot-password"
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              >
                Solicitar nuevo enlace
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/60">Nueva contrasena</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-slate-950">
          Define tu nueva credencial
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Al completar este paso se actualiza `UserCredential`, se consume el token y se revocan sesiones anteriores.
        </p>

        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>

        <Link href="/login" className="mt-6 inline-block text-sm text-emerald-700">
          Volver a iniciar sesion
        </Link>
      </div>
    </main>
  );
}
