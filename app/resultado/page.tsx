"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AccountButton } from "@/components/auth/account-button";
import { NatalChartExperience } from "@/components/chart/natal-chart-experience";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { isStorageEventFor, safeGetStorageItem } from "@/lib/browser-storage";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";

let cachedRawResult: string | null = null;
let cachedParsedResult: ChartCalculationResult | null = null;

function readStoredChartResult() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = safeGetStorageItem("session", CHART_RESULT_KEY);

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
    if (isStorageEventFor("session", event, CHART_RESULT_KEY)) {
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

  useEffect(() => {
    if (checkoutStatus === "success" || checkoutStatus === "cancelled") {
      const showTimeout = window.setTimeout(() => setBanner(checkoutStatus), 0);
      const hideTimeout = window.setTimeout(() => setBanner(null), 4000);
      return () => {
        window.clearTimeout(showTimeout);
        window.clearTimeout(hideTimeout);
      };
    }

    return undefined;
  }, [checkoutStatus]);

  return (
    <main className="sarita-result-observatory premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-[100svh] py-4 sm:min-h-screen sm:py-6">
        <Container className="relative flex min-h-[100svh] flex-col pt-[calc(env(safe-area-inset-top)+3.1rem)] sm:min-h-screen sm:pt-14">
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

          <div className="sarita-result-topbar pointer-events-none fixed inset-x-0 top-0 z-[60]">
            <div className="mx-auto grid min-h-[calc(env(safe-area-inset-top)+4rem)] max-w-[1180px] grid-cols-[2.75rem_1fr_2.75rem] items-end gap-2 px-5 pb-3 sm:min-h-14 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4 sm:px-6 sm:pb-0 lg:px-8">
            <Link
              href="/"
              className="sarita-result-float-control pointer-events-auto flex h-10 w-10 items-center justify-center justify-self-start overflow-hidden rounded-full text-[1.6rem] leading-none text-[#fffdf8] transition hover:text-[#f5d782] sm:h-auto sm:w-auto sm:truncate sm:rounded-none sm:border-0 sm:bg-transparent sm:text-xs sm:font-medium sm:uppercase sm:tracking-[0.24em] sm:shadow-none"
              aria-label={dictionary.result.back}
            >
              <span className="sm:hidden">{"\u2039"}</span>
              <span className="hidden sm:inline">{"\u2190"} {dictionary.result.back}</span>
            </Link>

            <p className="pointer-events-none justify-self-center font-serif text-[15px] uppercase tracking-[0.28em] text-[#f5d782] [text-shadow:0_0_16px_rgba(245,215,130,0.22),0_0_30px_rgba(124,191,255,0.18)] sm:text-[12px] sm:font-semibold sm:tracking-[0.22em]">
              <span className="sm:hidden">{dictionary.brand.name}</span>
              <span className="hidden sm:inline">{result?.saved ? dictionary.standalonePages.savedReading : ""}</span>
            </p>

            <div className="pointer-events-auto flex min-w-0 items-center gap-2 justify-self-end sm:gap-4 sm:border-l sm:border-[#fffaf0]/14 sm:pl-4">
              <Link
                href="/form"
                className="hidden text-right text-[10px] font-medium uppercase tracking-[0.16em] text-[#fffaf0]/72 transition hover:text-[#d7bd6a] min-[430px]:inline sm:text-xs sm:tracking-[0.24em]"
              >
                {dictionary.form.back}
              </Link>
              <span className="sm:hidden">
                <AccountButton compact />
              </span>
              <span className="hidden sm:inline">
                <AccountButton />
              </span>
            </div>
          </div>

          </div>

          {result ? (
            <NatalChartExperience
              chart={result.chart}
              dictionary={dictionary}
              locale={locale}
              isMock={result.isMock}
              request={result.request}
              readingId={result.readingId}
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
