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

function SolarSystemLoader() {
  const orbits = [
    { size: "h-24 w-24", duration: "10s", planet: "h-2 w-2 bg-[#64d2c4]" },
    { size: "h-36 w-36", duration: "15s", planet: "h-2.5 w-2.5 bg-[#d7bd6a]" },
    { size: "h-48 w-48", duration: "22s", planet: "h-2 w-2 bg-[#e55d80]" },
  ];

  return (
    <div className="relative h-56 w-56" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fffaf0,#f2d376_48%,#7a4bff_100%)] shadow-[0_0_40px_rgba(242,211,118,0.55)]" />
      {orbits.map((orbit) => (
        <div
          key={orbit.size}
          className={[
            "sarita-orbit absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d7d0ff]/18",
            orbit.size,
          ].join(" ")}
          style={{ animationDuration: orbit.duration }}
        >
          <span className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-full ${orbit.planet} shadow-[0_0_16px_currentColor]`} />
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
    <main className="sarita-cosmic-shell sarita-comet-field relative isolate min-h-screen overflow-hidden">
      <AtmosphericBackground variant="page" />
      <Image
        src={illustrations.scenes.landing}
        alt=""
        fill
        priority
        className="cosmos-slow-zoom pointer-events-none object-cover opacity-50 saturate-[0.78]"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,19,0.2),rgba(7,7,19,0.82)_55%,#070713)]" />

      <section className="relative min-h-screen py-8 sm:py-10">
        <Container className="relative flex min-h-screen items-center justify-center">
          <Reveal mode="immediate" className="mx-auto w-full max-w-[720px] text-center">
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 sm:min-h-0">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#d7bd6a]/82">
                {dictionary.brand.name}
              </p>

              <SolarSystemLoader />

              <div className="space-y-4" aria-live="polite">
                <p className="sarita-sheen inline-block font-serif text-3xl leading-tight text-[#fffaf0] sm:text-4xl">
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
                    className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#5c4a24] transition hover:text-dusty-gold"
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
                    className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.24em] text-[#5c4a24] transition hover:text-dusty-gold"
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

