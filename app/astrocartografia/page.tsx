"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { AstrocartographyPage } from "@/components/chart/astrocartography-page";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PricingModal } from "@/components/paywall/pricing-modal";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";
import { usePlan } from "@/lib/use-plan";

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

export default function AstrocartografiaRoutePage() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const { plan, loading: planLoading } = usePlan();
  const [pricingOpen, setPricingOpen] = useState(false);
  const result = useSyncExternalStore(
    subscribeToChartResult,
    readStoredChartResult,
    () => null,
  );
  const locked = !planLoading && plan !== "avanzado";

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-[100svh] py-4 sm:min-h-screen sm:py-6">
        <Container className="relative flex min-h-[100svh] flex-col sm:min-h-screen">
          <div className="mb-3 flex items-center justify-between gap-4 pt-1 sm:mb-4">
            <Link
              href="/resultado"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.28em]"
            >
              {dictionary.form.back}
            </Link>
          </div>

          {result?.chart && locked ? (
            <div className="mx-auto mt-10 max-w-2xl border-y border-dusty-gold/14 py-10 text-center sm:mt-16 sm:py-14">
              <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
                {dictionary.result.primaryTabs.astrocartography}
              </p>
              <h1 className="mt-3 font-serif text-[32px] leading-tight text-ivory sm:text-[38px]">
                {dictionary.paywall.lockedTabTitle.replace("{plan}", dictionary.paywall.avanzadoName)}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#3a3048]">
                {dictionary.paywall.lockedTabBody.replace("{plan}", dictionary.paywall.avanzadoName)}
              </p>
              <button
                type="button"
                onClick={() => setPricingOpen(true)}
                className="mt-8 border border-dusty-gold/32 bg-dusty-gold/10 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24] transition hover:border-dusty-gold/55 hover:bg-dusty-gold/16"
              >
                {dictionary.paywall.lockedTabCta}
              </button>
            </div>
          ) : result?.chart ? (
            <AstrocartographyPage
              chart={result.chart}
              request={result.request}
              dictionary={dictionary}
              readingId={result.readingId}
              gender={result.request?.gender || undefined}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-4xl border border-black/10 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <p className="text-sm leading-7 text-[#3a3048]">
                  {dictionary.result.messages.missingResult}
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
          <PricingModal
            open={pricingOpen}
            onClose={() => setPricingOpen(false)}
            requiredPlan="avanzado"
          />
        </Container>
      </section>
    </main>
  );
}
