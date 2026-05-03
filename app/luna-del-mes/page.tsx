"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { LunaDelMesPage } from "@/components/lunar/luna-del-mes-page";
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

export default function LunaDelMesRoutePage() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const result = useSyncExternalStore(
    subscribeToChartResult,
    readStoredChartResult,
    () => null,
  );

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-[100svh] py-4 sm:min-h-screen sm:py-6">
        <Container className="relative flex min-h-[100svh] flex-col sm:min-h-screen">
          <div className="mb-3 flex items-center justify-between gap-3 pt-1 sm:mb-4 sm:gap-4">
            <Link
              href="/"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]"
            >
              {dictionary.result.back}
            </Link>

            <Link
              href="/resultado"
              className="text-right text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-[#3a3048] sm:text-xs sm:tracking-[0.28em]"
            >
              {dictionary.standalonePages.yourChart}
            </Link>
          </div>

          {result ? (
            <LunaDelMesPage chart={result.chart} dictionary={dictionary} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-4xl border border-black/10 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <p className="text-sm leading-7 text-[#3a3048]">
                  {dictionary.standalonePages.moonMissingChart}
                </p>
                <Link
                  href="/form"
                  className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#5c4a24] transition hover:text-dusty-gold"
                >
                  {dictionary.form.back}
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
