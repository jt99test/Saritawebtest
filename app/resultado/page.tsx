"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { NatalChartExperience } from "@/components/chart/natal-chart-experience";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { mockNatalChart } from "@/lib/chart";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { getDictionary } from "@/lib/i18n";

const dictionary = getDictionary("es");

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

export default function ResultPage() {
  const result = useSyncExternalStore(
    subscribeToChartResult,
    readStoredChartResult,
    () => null,
  );

  const chart = result?.chart ?? mockNatalChart;
  const isMock = result?.isMock ?? true;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-6 sm:py-8">
        <Container className="relative flex min-h-screen flex-col">
          <div className="mb-6 flex items-center justify-between gap-4 pt-2">
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/54 transition hover:text-ivory"
            >
              {dictionary.result.back}
            </Link>

            <Link
              href="/form"
              className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/42 transition hover:text-ivory/72"
            >
              {dictionary.form.back}
            </Link>
          </div>

          {result ? (
            <NatalChartExperience chart={chart} dictionary={dictionary} isMock={isMock} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-4xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <p className="text-sm leading-7 text-ivory/62">{dictionary.result.messages.missingResult}</p>
                <Link
                  href="/form"
                  className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.24em] text-dusty-gold/80 transition hover:text-dusty-gold"
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

