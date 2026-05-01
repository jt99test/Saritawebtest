"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { illustrations } from "@/data/illustrations";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { calculateChartAction } from "@/lib/actions";
import {
  CHART_DRAFT_KEY,
  CHART_RESULT_KEY,
  type ChartActionResult,
  type ChartCalculationResult,
  type ChartLimitReachedResult,
  type FormValues,
} from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";

const chartGenerationPromises = new Map<string, Promise<ChartActionResult>>();

function getChartGenerationPromise(rawDraft: string, draft: FormValues) {
  const existing = chartGenerationPromises.get(rawDraft);

  if (existing) {
    return existing;
  }

  const promise = calculateChartAction(draft).finally(() => {
    chartGenerationPromises.delete(rawDraft);
  });

  chartGenerationPromises.set(rawDraft, promise);
  return promise;
}

export default function LoadingPage() {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState<ChartLimitReachedResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rawDraft = sessionStorage.getItem(CHART_DRAFT_KEY);

    if (!rawDraft) {
      router.replace("/form");
      return;
    }

    let draft: FormValues;
    try {
      draft = JSON.parse(rawDraft) as FormValues;
    } catch {
      router.replace("/form");
      return;
    }

    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, dictionary.loading.steps.length - 1));
    }, 1800);
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setError(dictionary.standalonePages.loadingTimeout);
      }
    }, 45000);

    (async () => {
      try {
        const result = await getChartGenerationPromise(rawDraft, draft);
        if (cancelled) {
          return;
        }
        window.clearTimeout(timeout);

        if ("limitReached" in result) {
          setLimitReached(result);
          return;
        }

        sessionStorage.setItem(CHART_RESULT_KEY, JSON.stringify(result satisfies ChartCalculationResult));
        router.replace("/resultado");
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message =
          caughtError instanceof Error ? caughtError.message : dictionary.loading.errorFallback;
        setError(message);
      } finally {
        window.clearInterval(timer);
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [dictionary.loading.steps.length, dictionary.standalonePages.loadingTimeout, router]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <Image
        src={illustrations.scenes.landing}
        alt=""
        fill
        priority
        className="cosmos-slow-zoom pointer-events-none object-cover opacity-50 saturate-[0.78]"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_55%,#f5f0e6)]" />

      <section className="relative min-h-screen py-8 sm:py-10">
        <Container className="relative flex min-h-screen items-center justify-center">
          <Reveal mode="immediate" className="mx-auto w-full max-w-[720px] text-center">
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 sm:min-h-0">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#3a3048]">
                {dictionary.brand.name}
              </p>

              <div className="space-y-4" aria-live="polite">
                <p className="font-serif text-3xl leading-tight text-ivory sm:text-4xl">
                  {dictionary.loading.steps[stepIndex] ?? dictionary.standalonePages.loadingFallback}
                </p>
                <div className="flex items-center justify-center gap-2" aria-hidden="true">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 rounded-full bg-dusty-gold/80 [animation:pulse_1.4s_ease-in-out_infinite]"
                      style={{ animationDelay: `${dot * 160}ms` }}
                    />
                  ))}
                </div>
              </div>

              {limitReached ? (
                <div className="mt-8 max-w-md border border-dusty-gold/18 bg-white px-5 py-5 text-sm text-[#3a3048]">
                  <p className="font-serif text-[21px] leading-tight text-ivory">
                    {dictionary.standalonePages.limitTitle}
                  </p>
                  <p className="mt-3 leading-7">
                    {dictionary.standalonePages.limitBody
                      .replace("{count}", String(limitReached.count))
                      .replace("{limit}", String(limitReached.limit))}
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#6f613a] transition hover:text-dusty-gold"
                  >
                    {dictionary.standalonePages.viewOptions}
                  </Link>
                </div>
              ) : null}

              {error ? (
                <div className="mt-8 rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-sm text-[#3a3048]">
                  <p>{error}</p>
                  <Link
                    href="/form"
                    className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#6f613a] transition hover:text-dusty-gold"
                  >
                    {dictionary.form.back}
                  </Link>
                </div>
              ) : null}
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}

