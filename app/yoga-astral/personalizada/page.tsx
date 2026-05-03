"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";
import { getPersonalizedYogaRoutine, type PersonalizedYogaRoutine, type RoutineElement } from "@/lib/personalized-yoga";

const ELEMENT_LABELS: Record<RoutineElement, string> = {
  fuego: "Fuego",
  tierra: "Tierra",
  agua: "Agua",
  aire: "Aire",
};

const ELEMENT_META: Record<RoutineElement, { badgeClass: string }> = {
  fuego: { badgeClass: "border-[#b66a4c]/30 bg-[#b66a4c]/10 text-[#793b2a]" },
  tierra: { badgeClass: "border-[#6f7f59]/30 bg-[#6f7f59]/10 text-[#435032]" },
  agua: { badgeClass: "border-[#5f8390]/30 bg-[#5f8390]/10 text-[#36515c]" },
  aire: { badgeClass: "border-[#7971a7]/30 bg-[#7971a7]/10 text-[#514a78]" },
};

let cachedRawResult: string | null = null;
let cachedParsedResult: ChartCalculationResult | null = null;

function readStoredChartResult() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CHART_RESULT_KEY);
  if (raw === cachedRawResult) return cachedParsedResult;
  cachedRawResult = raw;
  if (!raw) {
    cachedParsedResult = null;
    return null;
  }
  try {
    cachedParsedResult = JSON.parse(raw) as ChartCalculationResult;
  } catch {
    cachedParsedResult = null;
  }
  return cachedParsedResult;
}

function subscribeToChartResult(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === window.sessionStorage && event.key === CHART_RESULT_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
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

export default function PersonalizedYogaPage() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const result = useSyncExternalStore(subscribeToChartResult, readStoredChartResult, () => null);
  const [routine, setRoutine] = useState<PersonalizedYogaRoutine | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!result?.chart) {
      setRoutine(null);
      return undefined;
    }

    void getPersonalizedYogaRoutine(result.chart).then((nextRoutine) => {
      if (!cancelled) {
        setRoutine(nextRoutine);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [result?.chart]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-4 sm:py-8">
        <Container className="relative">
          <div className="mb-4 flex items-center justify-between gap-4 pt-2 sm:mb-6">
            <Link href="/yoga-astral" className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]">
              {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
            </Link>
          </div>

          {!result?.chart ? (
            <div className="flex min-h-[70vh] items-center justify-center text-center">
              <div>
                <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[#5c4a24]">yoga astral</p>
                <h1 className="mt-2 font-serif text-[38px] leading-tight text-ivory sm:text-[48px]">{dictionary.standalonePages.needChartTitle}</h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-[15px] italic leading-7 text-[#3a3048] sm:text-[17px] sm:leading-8">
                  {dictionary.standalonePages.needChartBody}
                </p>
              </div>
            </div>
          ) : routine ? (
            <div className="space-y-8 pb-10 sm:space-y-10">
              <header className="border-t border-[rgba(181,163,110,0.15)] pt-6 sm:pt-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">Yoga astral</p>
                <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
                  {routine.secondary
                    ? `${ELEMENT_LABELS[routine.primary]} ${routine.primaryPercent}% + ${ELEMENT_LABELS[routine.secondary]} ${routine.secondaryPercent}%`
                    : `Elemento ${ELEMENT_LABELS[routine.primary]}`}
                </h1>
                <p className="mt-6 max-w-3xl text-sm leading-7 text-[#3a3048]">
                  Esta secuencia se calcula con tu carta y rota cada mes. Mantiene el elemento dominante como base y mezcla el segundo elemento activo para que la práctica sea más personal y menos repetitiva.
                </p>
              </header>

              <section className="space-y-5">
                <SectionHeader>La secuencia · {routine.monthKey}</SectionHeader>
                <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-dusty-gold/16 bg-[#f5f0e6]/94 px-4 py-3 shadow-[0_12px_34px_rgba(30,26,46,0.08)] backdrop-blur-md sm:-mx-6 sm:px-6">
                  <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
                    <span>{routine.secondary ? "Rutina combinada" : "Rutina personalizada"}</span>
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
                      <li key={`${asana.element}-${asana.slug}-${index}`}>
                        <PremiumCard className="overflow-hidden border-black/10 bg-white/88 shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
                          <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                            <div className={`border-b border-black/10 bg-[#f8f4eb]/70 p-4 sm:p-5 lg:border-b-0 ${reverse ? "lg:order-2 lg:border-l" : "lg:border-r"}`}>
                              <AsanaVisual asana={asana} tone={asana.element} />
                            </div>
                            <div className="flex flex-col justify-center p-6 sm:p-8">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#5c4a24]">
                                  {index + 1}
                                </span>
                                <span className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}>
                                  {ELEMENT_LABELS[asana.element]}
                                </span>
                                <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]">
                                  {asana.duration}
                                </span>
                              </div>
                              <h3 className="mt-5 font-serif text-2xl leading-tight text-ivory sm:text-3xl">{asana.nameSanskrit}</h3>
                              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#3a3048]">{asana.nameSpanish}</p>
                              <p className="mt-5 text-sm leading-7 text-[#3a3048]">{asana.description}</p>
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

              <footer className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
                <Link href="/yoga-astral" className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.24em]">
                  {dictionary.form.back} · {dictionary.result.primaryTabs.yoga}
                </Link>
                <RoutineCompletionButton storageKey={`sarita:yoga:personalizada:${routine.monthKey}:completed`} />
              </footer>
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}
