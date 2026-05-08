import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";

import { getLavadoIntestinal } from "@/data/sarita/lavado-intestinal";
import { LavadoBuyButton } from "@/components/paywall/lavado-buy-button";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { AsanaVisual } from "@/components/yoga/asana-visual";
import { dictionaries, defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-[2rem] leading-tight text-ivory sm:text-[2.35rem]">
        {children}
      </h2>
      <div className="mt-3 h-0.5 w-10 rounded-full bg-dusty-gold/70" />
    </div>
  );
}

export default async function LavadoIntestinalPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dictionary = dictionaries[locale];
  const lavadoCopy = dictionary.lavadoPage;
  const lavadoIntestinal = getLavadoIntestinal(locale);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("billing_period,lavado_purchased")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const hasAccess = Boolean(profile?.lavado_purchased) || profile?.billing_period === "yearly";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:py-8">
        <Container className="relative">
          <div className="mb-4 flex items-center justify-between gap-4 pt-2 sm:mb-6">
            <Link
              href="/yoga-astral"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]"
            >
              {dictionary.form.back}
            </Link>
          </div>

          <div className="space-y-8 pb-10 sm:space-y-10">
            <PremiumCard className="overflow-hidden border-black/10 bg-white/88 p-5 shadow-[0_18px_48px_rgba(30,26,46,0.08)] sm:p-7">
              <div className="px-2 py-5 sm:px-8 sm:py-10">
                <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">
                  {lavadoCopy.eyebrow}
                </p>
                <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
                  {lavadoIntestinal.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#3a3048] sm:text-base sm:leading-8">
                  {lavadoCopy.subtitle}
                </p>
              </div>
            </PremiumCard>

            <section className="rounded-[1.2rem] border border-dusty-gold/24 bg-[#f8f4eb] p-5 text-[#3a3048] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58)] sm:p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-[#6f5a2a]">
                {lavadoCopy.importantPrecaution}
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#3a3048]">
                {lavadoIntestinal.precautions}
              </p>
            </section>

            {!hasAccess ? (
              <section className="mx-auto max-w-2xl border-y border-dusty-gold/18 py-10 text-center">
                <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
                  {dictionary.paywall.lavado.gateTitle}
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#3a3048]">
                  {dictionary.paywall.lavado.gateBody}
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <LavadoBuyButton
                    label={dictionary.paywall.lavado.gateOnetimeCta}
                    loadingLabel={dictionary.paywall.checkoutLoading}
                  />
                  <Link
                    href="/resultado"
                    className="border border-black/10 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:border-black/15 hover:text-ivory"
                  >
                    {dictionary.paywall.lavado.gatePlansCta}
                  </Link>
                </div>
              </section>
            ) : null}

            {hasAccess ? (
              <>
            <PremiumCard className="border-black/10 bg-white/70 px-5 py-8 shadow-[0_12px_34px_rgba(30,26,46,0.06)] sm:px-7 sm:py-10">
              <h2 className="font-serif text-3xl text-ivory">{lavadoCopy.preparation}</h2>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-[#3a3048]">
                {lavadoIntestinal.preparation}
              </p>
            </PremiumCard>

            <section className="space-y-5">
              <SectionHeader>{lavadoCopy.protocol}</SectionHeader>
              <ol className="grid gap-4">
                {lavadoIntestinal.protocol.map((step, index) => (
                  <li key={step}>
                    <PremiumCard className="rounded-[1.1rem] border-black/10 bg-white/74 p-5 shadow-[0_10px_28px_rgba(30,26,46,0.05)]">
                      <div className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-lg text-[#5c4a24]">
                          {index + 1}
                        </span>
                        <p className="pt-1 text-sm leading-7 text-[#3a3048]">{step}</p>
                      </div>
                    </PremiumCard>
                  </li>
                ))}
              </ol>
            </section>

            <section className="space-y-5">
              <SectionHeader>{lavadoCopy.asanasTitle}</SectionHeader>
              <ol className="space-y-6">
                {lavadoIntestinal.asanas.map((asana, index) => {
                  const reverse = index % 2 === 1;

                  return (
                    <li key={asana.slug}>
                      <PremiumCard className="overflow-hidden border-black/10 bg-white/88 shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
                        <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1fr)]">
                          <div
                            className={`border-b border-black/10 p-4 sm:p-5 lg:border-b-0 ${
                              reverse ? "lg:order-2 lg:border-l" : "lg:border-r"
                            }`}
                          >
                            <AsanaVisual
                              asana={asana}
                              tone="neutral"
                              missingImageLabel={locale === "en" ? "No photo available" : locale === "it" ? "Foto non disponibile" : "Sin foto disponible"}
                            />
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#5c4a24]">
                                {index + 1}
                              </span>
                              <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]">
                                {asana.duration}
                              </span>
                            </div>
                            <h3 className="mt-5 font-serif text-3xl leading-tight text-ivory">
                              {asana.nameSpanish}
                            </h3>
                            {asana.nameSanskrit !== asana.nameSpanish ? (
                              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#3a3048]">
                                {asana.nameSanskrit}
                              </p>
                            ) : null}
                            {asana.description ? (
                              <p className="mt-5 text-sm leading-7 text-[#3a3048]">
                                {asana.description}
                              </p>
                            ) : null}
                            {asana.warning ? (
                              <div className="mt-5 rounded-[1rem] border border-dusty-gold/26 bg-[#f8f4eb] px-4 py-3 text-[#3a3048] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58)]">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#6f5a2a]">
                                  {lavadoCopy.precaution}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[#3a3048]">
                                  {asana.warning}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </PremiumCard>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [lavadoCopy.timing.momento, lavadoIntestinal.timing.momento],
                [lavadoCopy.timing.duracion, lavadoIntestinal.timing.duracion],
                [lavadoCopy.timing.descanso, lavadoIntestinal.timing.descanso],
                [lavadoCopy.timing.alimentacion, lavadoIntestinal.timing.alimentacion],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.1rem] border border-black/10 bg-white/74 p-5 shadow-[0_10px_28px_rgba(30,26,46,0.05)]"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#3a3048]">
                    {label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-[1.2rem] border border-dusty-gold/20 bg-white/70 p-5 shadow-[0_10px_28px_rgba(30,26,46,0.05)] sm:p-7">
              <h2 className="font-serif text-3xl text-ivory">{lavadoCopy.precautions}</h2>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-[#3a3048]">
                {lavadoIntestinal.precautions}
              </p>
            </section>

            <section className="rounded-[1.2rem] border border-dusty-gold/20 bg-white/70 p-5 shadow-[0_10px_28px_rgba(30,26,46,0.05)] sm:p-7">
              <h2 className="font-serif text-3xl text-ivory">{lavadoCopy.benefits}</h2>
              <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-[#3a3048]">
                {lavadoIntestinal.benefits.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>{lavadoCopy.dietTitle}</SectionHeader>
              <p className="max-w-4xl text-sm leading-7 text-[#3a3048]">
                {lavadoIntestinal.threeDayDiet.description}
              </p>
              <div className="grid gap-5 lg:grid-cols-3">
                {lavadoIntestinal.threeDayDiet.days.map((day) => (
                  <PremiumCard
                    key={day.day}
                    className="border-black/10 bg-white/88 p-6 shadow-[0_14px_38px_rgba(30,26,46,0.07)]"
                  >
                    <h3 className="font-serif text-3xl font-semibold text-ivory">
                      {lavadoCopy.day.replace("{day}", String(day.day))}
                    </h3>
                    <div className="mt-5 space-y-5">
                      {day.meals.map((meal) => (
                        <div key={meal.type} className="border-t border-black/10 pt-4">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold">
                            {meal.type}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[#3a3048]">
                            {meal.primary}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[#3a3048]">
                            {lavadoCopy.alternative.replace("{text}", meal.alternative)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <footer className="border-t border-black/10 pt-6 text-center text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048]">
              {lavadoCopy.footer}
            </footer>
              </>
            ) : null}
          </div>
        </Container>
      </section>
    </main>
  );
}
