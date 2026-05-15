"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
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

function SolarSystemLoader() {
  const orbits = [
    {
      size: "h-[7rem] w-[7rem] sm:h-[9rem] sm:w-[9rem]",
      duration: "9s",
      direction: "normal" as const,
      planetPosition: "right-4 top-2",
      planet: "h-2 w-2 bg-[#fffaf0] text-[#fffaf0]",
    },
    {
      size: "h-[11rem] w-[11rem] sm:h-[14rem] sm:w-[14rem]",
      duration: "15s",
      direction: "reverse" as const,
      planetPosition: "bottom-6 left-7",
      planet: "h-3 w-3 bg-[#f5d782] text-[#f5d782]",
    },
    {
      size: "h-[15rem] w-[15rem] sm:h-[19rem] sm:w-[19rem]",
      duration: "22s",
      direction: "normal" as const,
      planetPosition: "right-9 top-8",
      planet: "h-4 w-4 bg-[#7cbfff] text-[#7cbfff]",
    },
    {
      size: "h-[17rem] w-[17rem] sm:h-[24rem] sm:w-[24rem]",
      duration: "34s",
      direction: "reverse" as const,
      planetPosition: "bottom-12 right-11",
      planet: "h-2.5 w-2.5 bg-[#0066ff] text-[#0066ff]",
    },
  ];

  return (
    <div className="relative h-[19rem] w-[19rem] sm:h-[26rem] sm:w-[26rem]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.22),transparent_42%),radial-gradient(circle_at_50%_50%,rgba(245,215,130,0.12),transparent_22%)] blur-sm" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff4b0,#f5d782_44%,rgba(245,215,130,0.18)_68%,transparent_72%)] shadow-[0_0_54px_rgba(245,215,130,0.44),0_0_130px_rgba(0,102,255,0.24)] sm:h-20 sm:w-20" />
      {orbits.map((orbit) => (
        <div
          key={orbit.size}
          className={[
            "sarita-orbit absolute left-1/2 top-1/2 rounded-full border border-[#7cbfff]/18 shadow-[0_0_34px_rgba(0,102,255,0.1),inset_0_0_28px_rgba(124,191,255,0.08)]",
            orbit.size,
          ].join(" ")}
          style={{
            animationDuration: orbit.duration,
            animationDirection: orbit.direction,
          }}
        >
          <span className={`absolute rounded-full ${orbit.planetPosition} ${orbit.planet} shadow-[0_0_18px_currentColor,0_0_44px_rgba(255,250,240,0.12)]`} />
        </div>
      ))}
    </div>
  );
}

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

        if ("authRequired" in result) {
          router.replace("/?auth=required");
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
    <main className="sarita-home-atmosphere premium-noise relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="sarita-starfield absolute inset-0" />
        <div className="sarita-meteor-field absolute inset-0">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="sarita-bright-starfield absolute inset-0">
          <span />
          <span />
          <span />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(245,215,130,0.12),transparent_18rem),radial-gradient(circle_at_50%_52%,rgba(0,102,255,0.26),transparent_28rem),linear-gradient(180deg,rgba(3,8,20,0.28),rgba(3,8,20,0.7)_72%,#030814)]" />
      </div>

      <section className="relative z-10 min-h-screen py-8 sm:py-10">
        <Container className="relative flex min-h-screen items-center justify-center px-4">
          <Reveal mode="immediate" className="mx-auto w-full max-w-[720px] text-center">
            <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-5 sm:min-h-0 sm:gap-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f5d782] drop-shadow-[0_0_18px_rgba(245,215,130,0.18)]">
                {dictionary.brand.name}
              </p>

              <SolarSystemLoader />

              <div className="space-y-4" aria-live="polite">
                <p className="sarita-sheen inline-block max-w-[24rem] font-serif text-3xl leading-tight text-[#fffaf0] drop-shadow-[0_0_28px_rgba(124,191,255,0.18)] sm:max-w-[34rem] sm:text-5xl">
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
                <div className="mt-8 max-w-md border border-[#f5d782]/22 bg-[#061331]/58 px-5 py-5 text-sm text-[#e8f3ff]/82 shadow-[0_20px_54px_rgba(0,0,0,0.28),0_0_34px_rgba(0,102,255,0.12)] backdrop-blur-md">
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
                    className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#f5d782] transition hover:text-ivory"
                  >
                    {dictionary.standalonePages.viewOptions}
                  </Link>
                </div>
              ) : null}

              {error ? (
                <div className="mt-8 rounded-2xl border border-[#d7e7ff]/14 bg-[#061331]/58 px-4 py-4 text-sm text-[#e8f3ff]/82 shadow-[0_20px_54px_rgba(0,0,0,0.28),0_0_34px_rgba(0,102,255,0.12)] backdrop-blur-md">
                  <p>{error}</p>
                  <Link
                    href="/form"
                    className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#f5d782] transition hover:text-ivory"
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

