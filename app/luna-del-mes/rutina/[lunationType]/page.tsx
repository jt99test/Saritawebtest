"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";

import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries, type Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata, LunationType } from "@/lib/lunar-report";
import { getLunarYogaRoutine } from "@/lib/lunar-yoga";
import type { PersonalizedYogaRoutine, RoutineElement } from "@/lib/personalized-yoga";
import { localizeAsana } from "@/data/sarita/yoga-routine-localization";

const ELEMENT_META: Record<RoutineElement, { badgeClass: string }> = {
  fuego: { badgeClass: "border-[#f5d782]/38 bg-[#f5d782]/12 text-[#f5d782]" },
  tierra: { badgeClass: "border-[#d7e7ff]/28 bg-[#d7e7ff]/8 text-[#d7e7ff]" },
  agua: { badgeClass: "border-[#7cbfff]/36 bg-[#0066ff]/12 text-[#7cbfff]" },
  aire: { badgeClass: "border-[#d7e7ff]/24 bg-[#071437]/72 text-[#d7e7ff]" },
};

const VALID_LUNATION_TYPES = new Set<LunationType>(["nueva", "llena", "nueva-2", "llena-2"]);

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

function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function routineTitle(routine: PersonalizedYogaRoutine, elementLabels: Record<RoutineElement, string>, elementTitle: string) {
  const parts = [
    `${elementLabels[routine.primary]} ${routine.primaryPercent}%`,
    routine.secondary ? `${elementLabels[routine.secondary]} ${routine.secondaryPercent}%` : null,
    routine.accent ? `${elementLabels[routine.accent]} ${routine.accentPercent}%` : null,
  ].filter(Boolean);

  if (parts.length > 1) {
    return parts.join(" + ");
  }

  return formatTemplate(elementTitle, { element: elementLabels[routine.primary] });
}

function getLunationLabel(type: LunationType, dictionary: Dictionary) {
  const base = type.startsWith("nueva") ? dictionary.lunar.newMoon : dictionary.lunar.fullMoon;
  return type.endsWith("-2") ? `${base} 2` : base;
}

export default function LunarYogaRoutinePage() {
  const params = useParams<{ lunationType: string }>();
  const searchParams = useSearchParams();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const result = useSyncExternalStore(subscribeToChartResult, readStoredChartResult, () => null);
  const lunationType = VALID_LUNATION_TYPES.has(params.lunationType as LunationType)
    ? params.lunationType as LunationType
    : "nueva";
  const now = useMemo(() => {
    const zone = result?.chart.event.timezoneIdentifier || "UTC";
    return DateTime.now().setZone(zone);
  }, [result?.chart.event.timezoneIdentifier]);
  const year = Number(searchParams.get("year") ?? now.year);
  const month = Number(searchParams.get("month") ?? now.month);
  const [metadata, setMetadata] = useState<LunarReportMetadata | null>(null);
  const [routine, setRoutine] = useState<PersonalizedYogaRoutine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const yogaCopy = dictionary.yogaAstral;
  const lunarCopy = dictionary.lunar;

  useEffect(() => {
    let cancelled = false;
    setMetadata(null);
    setRoutine(null);
    setError(null);

    if (!result?.chart) {
      return undefined;
    }

    (async () => {
      const response = await fetch("/api/lunar-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: result.chart,
          year,
          month,
          lunationType,
          metadataOnly: true,
          locale,
        }),
      }).catch(() => null);

      if (cancelled) {
        return;
      }

      if (!response?.ok) {
        setError(dictionary.lunar.calculateError);
        return;
      }

      const nextMetadata = await response.json() as LunarReportMetadata;
      const nextRoutine = await getLunarYogaRoutine(result.chart, nextMetadata);

      if (!cancelled) {
        setMetadata(nextMetadata);
        setRoutine(nextRoutine);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dictionary.lunar.calculateError, locale, lunationType, month, result?.chart, year]);

  const signLabel = metadata
    ? dictionary.result.signs[metadata.position.sign as keyof typeof dictionary.result.signs] ?? metadata.position.sign
    : "";
  const dateLabel = metadata
    ? DateTime.fromISO(metadata.timestamp, { zone: "utc" })
        .setZone(result?.chart.event.timezoneIdentifier || "UTC")
        .setLocale(locale)
        .toLocaleString({ day: "numeric", month: "long", year: "numeric" })
    : "";
  const sequenceLabel = metadata
    ? `${getLunationLabel(lunationType, dictionary)} · ${DateTime.utc(metadata.year, metadata.month, 1).setLocale(locale).toFormat("LLLL yyyy")}`
    : "";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-4 sm:py-8">
        <Container className="relative">
          <div className="mb-4 flex items-center justify-between gap-4 pt-2 sm:mb-6">
            <Link href="/luna-del-mes" className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]">
              {dictionary.form.back} · {dictionary.result.primaryTabs.moon}
            </Link>
          </div>

          {!result?.chart ? (
            <div className="flex min-h-[70vh] items-center justify-center text-center">
              <div>
                <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[#5c4a24]">{lunarCopy.lunarRoutineEyebrow}</p>
                <h1 className="mt-2 font-serif text-[38px] leading-tight text-ivory sm:text-[48px]">{dictionary.standalonePages.needChartTitle}</h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-[15px] italic leading-7 text-[#3a3048] sm:text-[17px] sm:leading-8">
                  {dictionary.standalonePages.needChartBody}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[60vh] items-center justify-center text-center">
              <p className="font-serif text-[17px] italic leading-8 text-[#3a3048]">{error}</p>
            </div>
          ) : metadata && routine ? (
            <div className="space-y-8 pb-10 sm:space-y-10">
              <header className="border-t border-[rgba(181,163,110,0.15)] pt-6 sm:pt-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">
                  {getLunationLabel(lunationType, dictionary)} · {signLabel} · {dateLabel}
                </p>
                <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
                  {routineTitle(routine, yogaCopy.elementLabels, yogaCopy.elementTitle)}
                </h1>
                <p className="mt-6 max-w-3xl text-sm leading-7 text-[#3a3048]">
                  {lunarCopy.lunarRoutineIntro}
                </p>
              </header>

              <section className="space-y-5">
                <div>
                  <h2 className="font-serif text-[2rem] leading-tight text-ivory sm:text-[2.35rem]">
                    {yogaCopy.sequence} · {sequenceLabel}
                  </h2>
                  <div className="mt-3 h-0.5 w-10 rounded-full bg-dusty-gold/70" />
                </div>
                <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-dusty-gold/16 bg-[#f5f0e6]/94 px-4 py-3 shadow-[0_12px_34px_rgba(30,26,46,0.08)] backdrop-blur-md sm:-mx-6 sm:px-6">
                  <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
                    <span>{lunarCopy.lunarRoutineBasedOnTransits}</span>
                    <span>{routine.asanas.length} {yogaCopy.asanas}</span>
                  </div>
                  <div className="mt-2 h-0.5 w-full bg-black/8">
                    <div className="h-full bg-dusty-gold/60" style={{ width: "100%" }} />
                  </div>
                </div>

                <ol className="space-y-6">
                  {routine.asanas.map((sourceAsana, index) => {
                    const asana = localizeAsana(sourceAsana, locale);
                    const reverse = index % 2 === 1;
                    return (
                      <li key={`${asana.element}-${asana.slug}-${index}`}>
                        <PremiumCard className="overflow-hidden border-black/10 bg-white/88 shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
                          <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                            <div className={`border-b border-black/10 bg-[#f8f4eb]/70 p-4 sm:p-5 lg:border-b-0 ${reverse ? "lg:order-2 lg:border-l" : "lg:border-r"}`}>
                              <AsanaVisual
                                asana={asana}
                                tone={asana.element}
                                missingImageLabel={locale === "en" ? "No photo available" : locale === "it" ? "Foto non disponibile" : "Sin foto disponible"}
                              />
                            </div>
                            <div className="flex flex-col justify-center p-6 sm:p-8">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#5c4a24]">
                                  {index + 1}
                                </span>
                                <span className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}>
                                  {yogaCopy.elementLabels[asana.element]}
                                </span>
                                <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]">
                                  {asana.duration}
                                </span>
                              </div>
                              <h3 className="mt-5 font-serif text-2xl leading-tight text-ivory sm:text-3xl">{asana.nameSpanish}</h3>
                              {asana.nameSanskrit !== asana.nameSpanish ? (
                                <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#3a3048]">
                                  {asana.nameSanskrit}
                                </p>
                              ) : null}
                              <p className="mt-5 text-sm leading-7 text-[#3a3048]">
                                {asana.description}
                              </p>
                              <div className="mt-5 rounded-[1rem] border border-dusty-gold/26 bg-[#f8f4eb] p-4 text-sm leading-7 text-[#3a3048] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f5a2a]">
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

              <footer className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
                <Link href="/luna-del-mes" className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.24em]">
                  {dictionary.form.back} · {dictionary.result.primaryTabs.moon}
                </Link>
                <RoutineCompletionButton storageKey={`sarita:yoga:lunar:${routine.monthKey}:${routine.id}:completed`} />
              </footer>
            </div>
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center text-center">
              <p className="font-serif text-[17px] italic leading-8 text-[#3a3048]">{yogaCopy.loadingTitle}</p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
