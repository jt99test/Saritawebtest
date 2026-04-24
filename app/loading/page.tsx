"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { calculateChartAction } from "@/lib/actions";
import { CHART_DRAFT_KEY, CHART_RESULT_KEY, type ChartCalculationResult, type FormValues } from "@/lib/chart-session";
import { getDictionary } from "@/lib/i18n";

const dictionary = getDictionary("es");

export default function LoadingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

    (async () => {
      try {
        const result = await calculateChartAction(draft);
        if (cancelled) {
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
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-8 sm:py-10">
        <Container className="relative flex min-h-screen items-center justify-center">
          <Reveal mode="immediate" className="mx-auto w-full max-w-2xl text-center">
            <div className="rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/46">
                {dictionary.brand.name}
              </p>

              <div className="mx-auto mt-8 h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-dusty-gold/75" />

              <div className="mt-8 space-y-3">
                {dictionary.loading.steps.map((step, index) => (
                  <p
                    key={step}
                    className={[
                      "text-sm transition-all duration-500 sm:text-base",
                      index === stepIndex
                        ? "text-ivory/90"
                        : index < stepIndex
                          ? "text-ivory/38"
                          : "text-ivory/22",
                    ].join(" ")}
                  >
                    {step}
                  </p>
                ))}
              </div>

              {error ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm text-ivory/60">
                  <p>{error}</p>
                  <Link
                    href="/form"
                    className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.24em] text-dusty-gold/80 transition hover:text-dusty-gold"
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
