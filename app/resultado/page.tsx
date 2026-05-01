"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AccountButton } from "@/components/auth/account-button";
import { NatalChartExperience } from "@/components/chart/natal-chart-experience";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { mockNatalChart } from "@/lib/chart";
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

function ResultPageContent() {
  const searchParams = useSearchParams();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const checkoutStatus = searchParams.get("checkout");
  const [banner, setBanner] = useState<"success" | "cancelled" | null>(
    checkoutStatus === "success" || checkoutStatus === "cancelled" ? checkoutStatus : null,
  );
  const result = useSyncExternalStore(
    subscribeToChartResult,
    readStoredChartResult,
    () => null,
  );

  const chart = result?.chart ?? mockNatalChart;
  const isMock = result?.isMock ?? true;

  useEffect(() => {
    if (checkoutStatus === "success" || checkoutStatus === "cancelled") {
      setBanner(checkoutStatus);
      const timeout = window.setTimeout(() => setBanner(null), 4000);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [checkoutStatus]);

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-5 sm:py-6">
        <Container className="relative flex min-h-screen flex-col">
          {banner ? (
            <div className="mb-4 flex items-center justify-between gap-4 border border-dusty-gold/20 bg-dusty-gold/10 px-4 py-3 text-sm text-ivory/78">
              <span>{banner === "success" ? dictionary.paywall.successBanner : dictionary.paywall.cancelBanner}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c4a24]"
              >
                {dictionary.common.close}
              </button>
            </div>
          ) : null}

          <div className="mb-4 grid min-h-10 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-black/10 pb-3 pt-1">
            <Link
              href="/"
              className="justify-self-start text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory"
            >
              ← {dictionary.result.back}
            </Link>

            <p className="justify-self-center text-[12px] font-semibold uppercase tracking-[0.22em] text-[#5c4a24]">
              {result?.saved ? dictionary.standalonePages.savedReading : ""}
            </p>

            <div className="flex items-center gap-4 justify-self-end border-l border-black/15 pl-4">
              <Link
                href="/form"
                className="text-right text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory/80"
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
              request={result.request}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-4xl border border-black/10 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <p className="text-sm leading-7 text-[#3a3048]">{dictionary.result.messages.missingResult}</p>
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

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultPageContent />
    </Suspense>
  );
}
