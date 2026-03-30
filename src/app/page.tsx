import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Landmark, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getDefaultOrganizationSlug } from "@/modules/organizations/application/queries/get-default-organization-slug";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    const slug = await getDefaultOrganizationSlug(session.user.id);

    if (slug) {
      redirect(`/${slug}/dashboard`);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,135,95,0.22),_transparent_30%),linear-gradient(180deg,_#f7faf6_0%,_#eef4ef_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-700/70">KAIKO</p>
            <p className="text-sm text-slate-600">Control contable con arquitectura real</p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link href="/login">Ingresar</Link>
          </Button>
        </header>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              <Sparkles className="size-4" />
              Multiempresa real, NIIF y capa fiscal Colombia
            </div>
            <h1 className="mt-8 max-w-4xl font-heading text-5xl leading-tight font-semibold tracking-tight text-slate-950 md:text-6xl">
              Software contable premium para equipos que necesitan claridad, control y trazabilidad.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              KAIKO combina operaciones, tesorería, conciliación, reporting y motor contable desacoplado sobre una base SaaS lista para producción.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/login">
                  Acceder al workspace
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-emerald-200 bg-white/70 px-6">
                <Link href="/kaiko-demo/dashboard">Ver demo estructural</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: Building2,
                title: "Gobierno multiempresa",
                description: "Aislamiento por organización, memberships, roles y permisos auditables.",
              },
              {
                icon: Landmark,
                title: "Motor contable robusto",
                description: "Posteo balanceado, vouchers manuales, apertura, cierres e idempotencia.",
              },
              {
                icon: ShieldCheck,
                title: "Operación lista para crecer",
                description: "Jobs, outbox, políticas de retención, logger estructurado y correlationId.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
              >
                <feature.icon className="size-6 text-emerald-700" />
                <h2 className="mt-5 font-heading text-2xl font-semibold text-slate-950">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
