import type { ReactNode } from "react";
import Link from "next/link";

import { lavadoIntestinal } from "@/data/sarita/lavado-intestinal";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { AsanaVisual } from "@/components/yoga/asana-visual";

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-[2rem] leading-tight text-ivory sm:text-[2.35rem]">
        {children}
      </h2>
      <div className="mt-3 h-0.5 w-10 rounded-full bg-[#e8c547]" />
    </div>
  );
}

export default function LavadoIntestinalPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-6 sm:py-8">
        <Container className="relative">
          <div className="mb-6 flex items-center justify-between gap-4 pt-2">
            <Link
              href="/yoga-astral"
              className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/54 transition hover:text-ivory"
            >
              Volver
            </Link>
          </div>

          <div className="space-y-10 pb-10">
            <PremiumCard className="overflow-hidden border-[#e8c547]/18 bg-[linear-gradient(180deg,rgba(23,12,36,0.82),rgba(8,10,18,0.74))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7">
              <div className="rounded-[1.45rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(232,197,71,0.13),transparent_34%),linear-gradient(180deg,rgba(15,10,28,0.9),rgba(8,10,18,0.82))] px-5 py-8 sm:px-8 sm:py-10">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e8c547]/80">
                  Kriyas y limpieza
                </p>
                <h1 className="mt-4 font-serif text-5xl leading-tight text-ivory sm:text-6xl">
                  {lavadoIntestinal.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-ivory/72">
                  Laghoo Shankhaprakshala · Una práctica suave de limpieza intestinal
                </p>
              </div>
            </PremiumCard>

            <PremiumCard className="border-[#e8c547]/16 bg-[linear-gradient(180deg,rgba(20,10,35,0.74),rgba(9,12,22,0.66))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
              <h2 className="font-serif text-3xl text-ivory">Preparación</h2>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-ivory/68">
                {lavadoIntestinal.preparation}
              </p>
            </PremiumCard>

            <section className="space-y-5">
              <SectionHeader>Protocolo paso a paso</SectionHeader>
              <ol className="grid gap-4">
                {lavadoIntestinal.protocol.map((step, index) => (
                  <li key={step}>
                    <PremiumCard className="border-[#e8c547]/14 bg-[linear-gradient(180deg,rgba(20,10,35,0.7),rgba(9,12,22,0.62))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                      <div className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8c547]/28 bg-[#e8c547]/10 font-serif text-lg text-[#e8c547]">
                          {index + 1}
                        </span>
                        <p className="pt-1 text-sm leading-7 text-ivory/70">{step}</p>
                      </div>
                    </PremiumCard>
                  </li>
                ))}
              </ol>
            </section>

            <section className="space-y-5">
              <SectionHeader>Las 5 asanas · 8 repeticiones cada una</SectionHeader>
              <ol className="space-y-6">
                {lavadoIntestinal.asanas.map((asana, index) => {
                  const reverse = index % 2 === 1;

                  return (
                    <li key={asana.slug}>
                      <PremiumCard className="overflow-hidden border-[#e8c547]/16 bg-[linear-gradient(180deg,rgba(20,10,35,0.76),rgba(9,12,22,0.7))] shadow-[0_26px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                        <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1fr)]">
                          <div
                            className={`border-b border-white/8 p-4 sm:p-5 lg:border-b-0 ${
                              reverse ? "lg:order-2 lg:border-l" : "lg:border-r"
                            }`}
                          >
                            <AsanaVisual asana={asana} tone="neutral" />
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8c547]/28 bg-[#e8c547]/10 font-serif text-xl text-[#e8c547]">
                                {index + 1}
                              </span>
                              <span className="rounded-full border border-[#e8c547]/18 bg-[#e8c547]/10 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#e8c547]/88">
                                {asana.duration}
                              </span>
                            </div>
                            <h3 className="mt-5 font-serif text-3xl leading-tight text-ivory">
                              {asana.nameSanskrit}
                            </h3>
                            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-ivory/46">
                              {asana.nameSpanish}
                            </p>
                            {asana.description ? (
                              <p className="mt-5 text-sm leading-7 text-ivory/68">
                                {asana.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </PremiumCard>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Momento", lavadoIntestinal.timing.momento],
                ["Duración", lavadoIntestinal.timing.duracion],
                ["Descanso", lavadoIntestinal.timing.descanso],
                ["Alimentación", lavadoIntestinal.timing.alimentacion],
              ].map(([label, value]) => (
                <PremiumCard
                  key={label}
                  className="border-[#e8c547]/14 bg-[linear-gradient(180deg,rgba(20,10,35,0.72),rgba(9,12,22,0.64))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
                >
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#e8c547]/74">
                    {label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-ivory/68">{value}</p>
                </PremiumCard>
              ))}
            </section>

            <PremiumCard className="border-amber-300/30 bg-[linear-gradient(180deg,rgba(48,31,15,0.52),rgba(16,13,16,0.68))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
              <h2 className="font-serif text-3xl text-amber-100">Precauciones</h2>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-amber-50/78">
                {lavadoIntestinal.precautions}
              </p>
            </PremiumCard>

            <PremiumCard className="border-[#e8c547]/16 bg-[linear-gradient(180deg,rgba(20,10,35,0.74),rgba(9,12,22,0.66))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
              <h2 className="font-serif text-3xl text-ivory">Beneficios</h2>
              <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-ivory/68">
                {lavadoIntestinal.benefits.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </PremiumCard>

            <section className="space-y-5">
              <SectionHeader>Dieta rica en fibra · 3 días de apoyo</SectionHeader>
              <p className="max-w-4xl text-sm leading-7 text-ivory/68">
                {lavadoIntestinal.threeDayDiet.description}
              </p>
              <div className="grid gap-5 lg:grid-cols-3">
                {lavadoIntestinal.threeDayDiet.days.map((day) => (
                  <PremiumCard
                    key={day.day}
                    className="border-[#e8c547]/14 bg-[linear-gradient(180deg,rgba(20,10,35,0.72),rgba(9,12,22,0.64))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl"
                  >
                    <h3 className="font-serif text-3xl text-ivory">Día {day.day}</h3>
                    <div className="mt-5 space-y-5">
                      {day.meals.map((meal) => (
                        <div key={meal.type} className="border-t border-white/10 pt-4">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#e8c547]/74">
                            {meal.type}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-ivory/72">
                            {meal.primary}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-ivory/52">
                            Alternativa: {meal.alternative}
                          </p>
                        </div>
                      ))}
                    </div>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <footer className="border-t border-white/10 pt-6 text-center text-xs font-medium uppercase tracking-[0.24em] text-ivory/48">
              Método S.A.R.I.T.A.® · Sarita Shakti
            </footer>
          </div>
        </Container>
      </section>
    </main>
  );
}
