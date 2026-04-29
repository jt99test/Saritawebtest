"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { AccountButton } from "@/components/auth/account-button";
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
  const plan = result?.usage?.plan ?? "free";

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-5 sm:py-6">
        <Container className="relative flex min-h-screen flex-col">
          <div className="mb-4 grid min-h-10 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/8 pb-3 pt-1">
            <Link
              href="/"
              className="justify-self-start text-xs font-medium uppercase tracking-[0.24em] text-ivory/68 transition hover:text-ivory"
            >
              ← {dictionary.result.back}
            </Link>

            <p className="justify-self-center text-[10px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/58">
              {result?.saved ? "Lectura guardada" : ""}
            </p>

            <div className="flex items-center gap-4 justify-self-end border-l border-white/12 pl-4">
              <Link
                href="/form"
                className="text-right text-xs font-medium uppercase tracking-[0.24em] text-ivory/54 transition hover:text-ivory/80"
              >
                {dictionary.form.back}
              </Link>
              <AccountButton />
            </div>
          </div>

          {result ? (
            <NatalChartExperience
              chart={chart}
              dictionary={dictionary}
              isMock={isMock}
              plan={plan}
              request={result.request}
            />
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
