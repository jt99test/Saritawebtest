"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { YogaAstralPage } from "@/components/yoga/yoga-astral-page";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";

let cachedRawResult: string | null = null;
let cachedParsedResult: ChartCalculationResult | null = null;

function readStoredChartResult() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CHART_RESULT_KEY);

  if (raw === cachedRawResult) {
    return cachedParsedResult;
  }

  cachedRawResult = raw;

  if (!raw) {
    cachedParsedResult = null;
    return cachedParsedResult;
  }

  try {
    cachedParsedResult = JSON.parse(raw) as ChartCalculationResult;
  } catch {
    cachedParsedResult = null;
  }

  return cachedParsedResult;
}

function subscribeToChartResult(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === window.sessionStorage && event.key === CHART_RESULT_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export default function YogaAstralRoutePage() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const result = useSyncExternalStore(
    subscribeToChartResult,
    readStoredChartResult,
    () => null,
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-6 sm:py-8">
        <Container className="relative flex min-h-screen flex-col">
          <div className="mb-6 flex items-center justify-between gap-4 pt-2">
            <Link
              href="/resultado"
              className="text-xs font-medium uppercase tracking-[0.28em] text-[#3a3048] transition hover:text-ivory"
            >
              {dictionary.form.back}
            </Link>
          </div>

          {result?.chart ? (
            <YogaAstralPage chart={result.chart} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-3xl text-center">
                <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[#6f613a]">
                  yoga astral
                </p>
                <h1 className="mt-2 font-serif text-[48px] font-normal leading-tight text-ivory">
                  {dictionary.standalonePages.needChartTitle}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-[17px] italic leading-8 text-[#3a3048]">
                  {dictionary.standalonePages.needChartBody}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                  <Link
                    href="/form"
                    className="font-serif text-[15px] text-[#6f613a] transition hover:text-dusty-gold"
                  >
                    {dictionary.standalonePages.goToForm}
                  </Link>
                  <Link
                    href="/resultado"
                    className="font-serif text-[15px] text-[#3a3048] transition hover:text-ivory"
                  >
                    {dictionary.standalonePages.backToResult}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
