import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { illustrations } from "@/data/illustrations";
import { yogaRoutines } from "@/data/sarita/yoga-routines";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PaidFeatureGate } from "@/components/paywall/paid-feature-gate";
import { PremiumCard } from "@/components/ui/premium-card";
import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { dictionaries, defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { getYogaElementMeta, localizeRoutine } from "@/data/sarita/yoga-routine-localization";

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

const ELEMENT_SIGN_GLYPHS: Record<Elemento, string[]> = {
  fuego: ["\u2648", "\u264c", "\u2650"],
  tierra: ["\u2649", "\u264d", "\u2651"],
  agua: ["\u264b", "\u264f", "\u2653"],
  aire: ["\u264a", "\u264e", "\u2652"],
};

const ELEMENT_META: Record<Elemento, { emotional: string; badgeClass: string }> = {
  fuego: {
    emotional: "Mente",
    badgeClass: "border-[#f5d782]/38 bg-[#f5d782]/12 text-[#f5d782]",
  },
  tierra: {
    emotional: "Estructura",
    badgeClass: "border-[#d7e7ff]/28 bg-[#d7e7ff]/8 text-[#d7e7ff]",
  },
  agua: {
    emotional: "Mundo emocional",
    badgeClass: "border-[#7cbfff]/36 bg-[#0066ff]/12 text-[#7cbfff]",
  },
  aire: {
    emotional: "Extroversión",
    badgeClass: "border-[#d7e7ff]/24 bg-[#071437]/72 text-[#d7e7ff]",
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
  const yogaCopy = dictionary.yogaAstral;
  if (!isElemento(elemento)) {
    notFound();
  }

  const routine = localizeRoutine(yogaRoutines[elemento], locale);
  const localizedMeta = getYogaElementMeta(elemento, locale);
  const chakraName = routine.chakra.name.split(" ")[0];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-4 sm:py-8">
        <Container className="relative">
          <div className="mb-4 flex items-center justify-between gap-4 pt-2 sm:mb-6">
            <Link
              href="/yoga-astral"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#d7e7ff]/72 transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]"
            >
              {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
            </Link>
          </div>

          <PaidFeatureGate dictionary={dictionary} featureName={yogaCopy.title}>
            <div className="space-y-8 pb-10 sm:space-y-10">
            <header className="border-t border-[rgba(181,163,110,0.15)] pt-6 sm:pt-8">
              <div>
                <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                  <Image
                    src={illustrations.elements[elemento]}
                    alt={ELEMENT_ALT_TEXT[elemento]}
                    width={120}
                    height={120}
                    priority
                    className="h-[92px] w-[92px] object-contain drop-shadow-[0_0_30px_rgba(232,197,71,0.18)] sm:h-[120px] sm:w-[120px]"
                    sizes="120px"
                  />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#f5d782]">
                      {yogaCopy.title}
                    </p>
                    <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
                      {yogaCopy.elementTitle.replace("{element}", yogaCopy.elementLabels[elemento])}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="border border-[#d7e7ff]/14 bg-[#071437]/60 px-3 py-1.5 text-xs leading-5 text-[#d7e7ff]/82">
                        {routine.bodyZone}
                      </span>
                      <span className="border border-dusty-gold/28 bg-dusty-gold/10 px-3 py-1.5 font-serif text-xs italic leading-5 text-[#f5d782]">
                        {localizedMeta?.emotional ?? ELEMENT_META[elemento].emotional}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 border-y border-dusty-gold/16 py-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [yogaCopy.planets, routine.planets.join(" · ")],
                    [
                      yogaCopy.signs,
                      routine.signs
                        .map((sign, index) => `${SIGN_GLYPHS[sign] ?? ELEMENT_SIGN_GLYPHS[elemento][index] ?? "✦"} ${sign}`)
                        .join(" · "),
                    ],
                    [yogaCopy.houses, routine.houses.join(" · ")],
                    [yogaCopy.chakra, `${chakraName} · ${yogaCopy.bijaMantra} ${routine.chakra.mantra}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-l border-dusty-gold/18 pl-4"
                    >
                      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f5d782]">
                        {label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ivory/82">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-7 max-w-3xl text-sm leading-7 text-[#e8f3ff]/82">
                  {routine.intention}
                </p>
              </div>
            </header>

            <section className="space-y-5">
              <SectionHeader>{yogaCopy.chartElement}</SectionHeader>
              <div className="grid gap-4 lg:grid-cols-3">
                {routine.signsAndHouses.map((entry, index) => (
                  <PremiumCard
                    key={entry.sign}
                    className="border-[#d7e7ff]/14 bg-[#061331]/42 p-5 shadow-[0_20px_54px_rgba(0,0,0,0.26),0_0_34px_rgba(0,102,255,0.1)] sm:p-6"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-[#f5d782]">
                      {dictionary.result.transitPage.housePrefix} {entry.houseNumber}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl text-ivory sm:text-3xl">
                      {SIGN_GLYPHS[entry.sign] ?? ELEMENT_SIGN_GLYPHS[elemento][index] ?? "✦"} {entry.sign}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[#e8f3ff]/82">
                      {entry.description}
                    </p>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>{yogaCopy.sequence} · {routine.totalDuration}</SectionHeader>
              <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-[#d7e7ff]/14 bg-[#030814]/86 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.28),0_0_28px_rgba(0,102,255,0.12)] backdrop-blur-md sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#fffdf8]/84">
                  <span>{yogaCopy.elementTitle.replace("{element}", yogaCopy.elementLabels[elemento])}</span>
                  <span>{routine.asanas.length} {yogaCopy.asanas}</span>
                </div>
                <div className="mt-2 h-px w-full bg-[#d7e7ff]/12">
                  <div className="h-full bg-[#f5d782] shadow-[0_0_12px_rgba(245,215,130,0.34)]" style={{ width: "100%" }} />
                </div>
              </div>
              <ol className="space-y-6">
                {routine.asanas.map((asana, index) => {
                  const reverse = index % 2 === 1;

                  return (
                    <li key={`${asana.slug}-${index}`}>
                      <PremiumCard className="overflow-hidden border-[#d7e7ff]/14 bg-[#061331]/42 shadow-[0_20px_54px_rgba(0,0,0,0.28),0_0_36px_rgba(0,102,255,0.1)]">
                        <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                          <div
                            className={`border-b border-[#d7e7ff]/12 bg-[#071437]/68 p-4 sm:p-5 lg:border-b-0 ${
                              reverse ? "lg:order-2 lg:border-l" : "lg:border-r"
                            }`}
                          >
                            <AsanaVisual
                              asana={asana}
                              tone={elemento}
                              missingImageLabel={locale === "en" ? "No photo available" : locale === "it" ? "Foto non disponibile" : "Sin foto disponible"}
                            />
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#f5d782]">
                                {index + 1}
                              </span>
                              <span
                                className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}
                              >
                                {yogaCopy.elementLabels[asana.element]}
                              </span>
                              <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f5d782]">
                                {asana.duration}
                              </span>
                            </div>
                            <h3 className="mt-5 font-serif text-2xl leading-tight text-ivory sm:text-3xl">
                              {asana.nameSpanish}
                            </h3>
                            {asana.nameSanskrit !== asana.nameSpanish ? (
                              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#d7e7ff]/66">
                                {asana.nameSanskrit}
                              </p>
                            ) : null}
                            <p className="mt-5 text-sm leading-7 text-[#e8f3ff]/82">
                              {asana.description}
                            </p>
                            <div className="mt-5 rounded-[1rem] border border-[#f5d782]/24 bg-[#030814]/52 p-4 text-sm leading-7 text-[#e8f3ff]/82 shadow-[0_0_24px_rgba(0,102,255,0.1),inset_0_0_0_1px_rgba(255,250,240,0.06)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5d782]">
                                {yogaCopy.precaution}
                              </p>
                              <p className="mt-2">{asana.warning}</p>
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
              <SectionHeader>{yogaCopy.pranayamaAfter}</SectionHeader>
              <div className="grid gap-5 md:grid-cols-2">
                {routine.pranayama.map((item) => (
                  <PremiumCard
                    key={item.name}
                    className="border-[#d7e7ff]/14 bg-[#061331]/42 p-6 shadow-[0_20px_54px_rgba(0,0,0,0.26),0_0_34px_rgba(0,102,255,0.1)] sm:p-7"
                  >
                    <h3 className="font-serif text-2xl text-ivory sm:text-3xl">{item.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-[#e8f3ff]/82">
                      {item.description}
                    </p>
                    {item.contraindications ? (
                      <div className="mt-5 rounded-[1rem] border border-[#f5d782]/24 bg-[#030814]/52 p-4 text-sm leading-7 text-[#e8f3ff]/82 shadow-[0_0_24px_rgba(0,102,255,0.1),inset_0_0_0_1px_rgba(255,250,240,0.06)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5d782]">{yogaCopy.precaution}</p>
                        <p className="mt-2">{item.contraindications}</p>
                      </div>
                    ) : null}
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>{yogaCopy.savasana} · {routine.savasana.duration}</SectionHeader>
              <PremiumCard className="mx-auto max-w-4xl border-[#d7e7ff]/14 bg-[#061331]/42 px-6 py-9 text-center shadow-[0_20px_54px_rgba(0,0,0,0.26),0_0_34px_rgba(0,102,255,0.1)] sm:px-10">
                <p className="text-base leading-8 text-[#e8f3ff]/82">
                  {routine.savasana.visualization}
                </p>
                <p className="mt-7 font-serif text-2xl text-[#f5d782] sm:mt-8 sm:text-3xl">
                  {yogaCopy.bijaMantra}: {routine.chakra.mantra} · {chakraName}
                </p>
              </PremiumCard>
            </section>

            <footer className="flex flex-col items-start justify-between gap-4 border-t border-[#d7e7ff]/12 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/yoga-astral"
                className="text-xs font-medium uppercase tracking-[0.24em] text-[#d7e7ff]/72 transition hover:text-ivory"
              >
                {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
              </Link>
              <RoutineCompletionButton storageKey={`sarita:yoga:${elemento}:completed`} />
            </footer>
            </div>
          </PaidFeatureGate>
        </Container>
      </section>
    </main>
  );
}
