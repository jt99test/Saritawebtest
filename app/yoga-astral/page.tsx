"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { YogaAstralPage } from "@/components/yoga/yoga-astral-page";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";

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
              className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/54 transition hover:text-ivory"
            >
              Volver
            </Link>
          </div>

          {result?.chart ? (
            <YogaAstralPage chart={result.chart} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-3xl text-center">
                <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
                  yoga astral
                </p>
                <h1 className="mt-2 font-serif text-[48px] font-normal leading-tight text-white">
                  Necesitamos tu carta
                </h1>
                <p className="mx-auto mt-4 max-w-2xl font-serif text-[17px] italic leading-8 text-white/55">
                  Genera primero tu carta o vuelve a resultado para abrir esta sección con tu contexto astrológico cargado.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                  <Link
                    href="/form"
                    className="font-serif text-[15px] text-dusty-gold/90 transition hover:text-dusty-gold"
                  >
                    Ir al formulario
                  </Link>
                  <Link
                    href="/resultado"
                    className="font-serif text-[15px] text-white/62 transition hover:text-white"
                  >
                    Volver a resultado
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
