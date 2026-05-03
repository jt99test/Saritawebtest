import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { illustrations } from "@/data/illustrations";
import { yogaRoutines } from "@/data/sarita/yoga-routines";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { dictionaries, defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

type Elemento = keyof typeof yogaRoutines;

const ELEMENTOS = ["fuego", "tierra", "agua", "aire"] as const;

const ELEMENT_ALT_TEXT: Record<Elemento, string> = {
  fuego: "Ilustracion del elemento Fuego",
  tierra: "Ilustracion del elemento Tierra",
  agua: "Ilustracion del elemento Agua",
  aire: "Ilustracion del elemento Aire",
};

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈",
  Tauro: "♉",
  "Géminis": "♊",
  Cancer: "♋",
  "Cáncer": "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Escorpio: "♏",
  Sagitario: "♐",
  Capricornio: "♑",
  Acuario: "♒",
  Piscis: "♓",
};

const ELEMENT_META: Record<Elemento, { emotional: string; badgeClass: string }> = {
  fuego: {
    emotional: "Mente",
    badgeClass: "border-[#b66a4c]/30 bg-[#b66a4c]/10 text-[#793b2a]",
  },
  tierra: {
    emotional: "Estructura",
    badgeClass: "border-[#6f7f59]/30 bg-[#6f7f59]/10 text-[#435032]",
  },
  agua: {
    emotional: "Mundo emocional",
    badgeClass: "border-[#5f8390]/30 bg-[#5f8390]/10 text-[#36515c]",
  },
  aire: {
    emotional: "Extroversión",
    badgeClass: "border-[#7971a7]/30 bg-[#7971a7]/10 text-[#514a78]",
  },
};

function isElemento(value: string): value is Elemento {
  return ELEMENTOS.includes(value as Elemento);
}

export function generateStaticParams() {
  return ELEMENTOS.map((elemento) => ({ elemento }));
}

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

export default async function YogaAstralElementPage({
  params,
}: {
  params: Promise<{ elemento: string }>;
}) {
  const { elemento } = await params;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dictionary = dictionaries[locale];

  if (!isElemento(elemento)) {
    notFound();
  }

  const routine = yogaRoutines[elemento];
  const chakraName = routine.chakra.name.split(" ")[0];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-6 sm:py-8">
        <Container className="relative">
          <div className="mb-6 flex items-center justify-between gap-4 pt-2">
            <Link
              href="/yoga-astral"
              className="text-xs font-medium uppercase tracking-[0.28em] text-[#3a3048] transition hover:text-ivory"
            >
              {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
            </Link>
          </div>

          <div className="space-y-10 pb-10">
            <header className="border-t border-[rgba(181,163,110,0.15)] pt-8">
              <div>
                <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                  <Image
                    src={illustrations.elements[elemento]}
                    alt={ELEMENT_ALT_TEXT[elemento]}
                    width={120}
                    height={120}
                    priority
                    className="h-[120px] w-[120px] object-contain drop-shadow-[0_0_30px_rgba(232,197,71,0.18)]"
                    sizes="120px"
                  />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">
                      Yoga astral
                    </p>
                    <h1 className="mt-4 font-serif text-5xl leading-tight text-ivory sm:text-6xl">
                      {routine.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="border border-black/10 bg-white px-3 py-1.5 text-xs leading-5 text-[#3a3048]">
                        {routine.bodyZone}
                      </span>
                      <span className="border border-dusty-gold/18 bg-dusty-gold/[0.055] px-3 py-1.5 font-serif text-xs italic leading-5 text-[#5c4a24]">
                        {ELEMENT_META[elemento].emotional}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 border-y border-dusty-gold/16 py-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Planetas", routine.planets.join(" · ")],
                    [
                      "Signos",
                      routine.signs
                        .map((sign) => `${SIGN_GLYPHS[sign] ?? "✦"} ${sign}`)
                        .join(" · "),
                    ],
                    ["Casas", routine.houses.join(" · ")],
                    ["Chakra", `${chakraName} · Mantra ${routine.chakra.mantra}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-l border-dusty-gold/18 pl-4"
                    >
                      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#3a3048]">
                        {label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ivory/82">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-7 max-w-3xl text-sm leading-7 text-[#3a3048]">
                  {routine.intention}
                </p>
              </div>
            </header>

            <section className="space-y-5">
              <SectionHeader>Tu carta y este elemento</SectionHeader>
              <div className="grid gap-4 lg:grid-cols-3">
                {routine.signsAndHouses.map((entry) => (
                  <PremiumCard
                    key={entry.sign}
                    className="border-black/10 bg-white/85 p-6 shadow-[0_14px_38px_rgba(30,26,46,0.08)]"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-[#3a3048]">
                      Casa {entry.houseNumber}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl text-ivory">
                      {SIGN_GLYPHS[entry.sign] ?? "✦"} {entry.sign}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[#3a3048]">
                      {entry.description}
                    </p>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>La secuencia · {routine.totalDuration}</SectionHeader>
              <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-dusty-gold/16 bg-[#f5f0e6]/94 px-4 py-3 shadow-[0_12px_34px_rgba(30,26,46,0.08)] backdrop-blur-md sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
                  <span>{routine.title}</span>
                  <span>{routine.asanas.length} {dictionary.yogaAstral?.asanas ?? "asanas"}</span>
                </div>
                <div className="mt-2 h-0.5 w-full bg-black/8">
                  <div className="h-full bg-dusty-gold/60" style={{ width: "100%" }} />
                </div>
              </div>
              <ol className="space-y-6">
                {routine.asanas.map((asana, index) => {
                  const reverse = index % 2 === 1;

                  return (
                    <li key={`${asana.slug}-${index}`}>
                      <PremiumCard className="overflow-hidden border-black/10 bg-white/88 shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
                        <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                          <div
                            className={`border-b border-black/10 bg-[#f8f4eb]/70 p-4 sm:p-5 lg:border-b-0 ${
                              reverse ? "lg:order-2 lg:border-l" : "lg:border-r"
                            }`}
                          >
                            <AsanaVisual asana={asana} tone={elemento} />
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#5c4a24]">
                                {index + 1}
                              </span>
                              <span
                                className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}
                              >
                                {asana.element}
                              </span>
                              <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]">
                                {asana.duration}
                              </span>
                            </div>
                            <h3 className="mt-5 font-serif text-3xl leading-tight text-ivory">
                              {asana.nameSanskrit}
                            </h3>
                            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#3a3048]">
                              {asana.nameSpanish}
                            </p>
                            <p className="mt-5 text-sm leading-7 text-[#3a3048]">
                              {asana.description}
                            </p>
                            <div className="mt-5 rounded-[1rem] border border-dusty-gold/24 bg-[#fff8df] p-4 text-sm leading-7 text-[#5c4a24]">
                              <span className="mr-2 font-semibold">Precaución:</span>
                              {asana.warning}
                            </div>
                          </div>
                        </div>
                      </PremiumCard>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="space-y-5">
              <SectionHeader>Pranayama · después de la secuencia</SectionHeader>
              <div className="grid gap-5 md:grid-cols-2">
                {routine.pranayama.map((item) => (
                  <PremiumCard
                    key={item.name}
                    className="border-black/10 bg-white/88 p-6 shadow-[0_14px_38px_rgba(30,26,46,0.08)] sm:p-7"
                  >
                    <h3 className="font-serif text-3xl text-ivory">{item.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-[#3a3048]">
                      {item.description}
                    </p>
                    {item.contraindications ? (
                      <div className="mt-5 rounded-[1rem] border border-dusty-gold/24 bg-[#fff8df] p-4 text-sm leading-7 text-[#5c4a24]">
                        {item.contraindications}
                      </div>
                    ) : null}
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>Savasana · {routine.savasana.duration}</SectionHeader>
              <PremiumCard className="mx-auto max-w-4xl border-black/10 bg-white/88 px-6 py-9 text-center shadow-[0_14px_38px_rgba(30,26,46,0.08)] sm:px-10">
                <p className="text-base leading-8 text-[#3a3048]">
                  {routine.savasana.visualization}
                </p>
                <p className="mt-8 font-serif text-3xl text-[#5c4a24]">
                  Mantra bija: {routine.chakra.mantra} · {chakraName}
                </p>
              </PremiumCard>
            </section>

            <footer className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/yoga-astral"
                className="text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory"
              >
                {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
              </Link>
              <RoutineCompletionButton storageKey={`sarita:yoga:${elemento}:completed`} />
            </footer>
          </div>
        </Container>
      </section>
    </main>
  );
}
