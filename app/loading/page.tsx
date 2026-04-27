"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { illustrations } from "@/data/illustrations";
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
          <Reveal mode="immediate" className="mx-auto w-full max-w-[720px] text-center">
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 sm:min-h-0">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/46">
                {dictionary.brand.name}
              </p>

              <div className="relative w-full max-w-[720px] overflow-hidden rounded-[1.6rem] border border-white/8 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
                <Image
                  src={illustrations.scenes.loading}
                  alt="Ilustracion cosmica para la espera"
                  width={720}
                  height={1080}
                  priority
                  className="cosmos-slow-zoom h-[58vh] min-h-[360px] w-full object-cover sm:h-auto sm:max-h-[68vh]"
                  sizes="(min-width: 768px) 720px, 100vw"
                />
              </div>

              <div className="space-y-4">
                <p className="font-serif text-3xl leading-tight text-ivory sm:text-4xl">
                  {dictionary.loading.steps[stepIndex] ?? "Calculando tu carta..."}
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
