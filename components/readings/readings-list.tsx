"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteReadingAction } from "@/app/lecturas/actions";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { illustrations } from "@/data/illustrations";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";

type StoredReading = {
  id: string;
  type: string | null;
  chart_data: unknown;
  created_at: string;
};

function getStoredResult(reading: StoredReading): ChartCalculationResult | null {
  const data = reading.chart_data as Partial<ChartCalculationResult> | null;

  if (!data?.chart || !data.request || typeof data.isMock !== "boolean") {
    return null;
  }

  return data as ChartCalculationResult;
}

export function ReadingsList({ readings }: { readings: StoredReading[] }) {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!readings.length) {
    return (
      <div className="mt-8 grid overflow-hidden border-t border-dusty-gold/14 pt-7 sm:grid-cols-[0.9fr_1.1fr] sm:gap-8">
        <div className="relative hidden min-h-52 overflow-hidden border border-white/8 sm:block">
          <Image
            src={illustrations.scenes.landing}
            alt=""
            fill
            className="object-cover opacity-58 saturate-[0.78]"
            sizes="320px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,13,0.2),rgba(5,7,13,0.84))]" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-serif text-[25px] leading-tight text-ivory">
            {dictionary.readings.emptyTitle}
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-ivory/58">
            {dictionary.readings.emptyBody}
          </p>
          <PrimaryButton
            href="/form"
            className="mt-6 self-start px-5 py-3 text-[0.72rem] uppercase tracking-[0.18em]"
          >
            {dictionary.readings.emptyCta}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-dusty-gold/14">
      {readings.map((reading) => {
        const result = getStoredResult(reading);
        const label = result?.chart.event.name ?? dictionary.readings.fallbackTitle;
        const typeLabel =
          reading.type && reading.type in dictionary.readings.types
            ? dictionary.readings.types[reading.type as keyof typeof dictionary.readings.types]
            : reading.type;
        const date = new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(reading.created_at));

        return (
          <article
            key={reading.id}
            className="grid gap-4 border-b border-white/8 py-5 transition hover:border-dusty-gold/24 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <button
              type="button"
              disabled={!result}
              onClick={() => {
                if (!result) {
                  return;
                }

                window.sessionStorage.setItem(CHART_RESULT_KEY, JSON.stringify(result));
                router.push("/resultado");
              }}
              className="min-w-0 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="font-serif text-[21px] leading-tight text-ivory">
                {label}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/38">
                {typeLabel} · {date}
              </p>
            </button>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {confirmingId === reading.id ? (
                <>
                  <button
                    type="button"
                    disabled={isPending && pendingId === reading.id}
                    onClick={() => {
                      setPendingId(reading.id);
                      startTransition(async () => {
                        const result = await deleteReadingAction(reading.id);
                        setPendingId(null);

                        if (result.ok) {
                          setConfirmingId(null);
                          router.refresh();
                        }
                      });
                    }}
                    className="inline-flex min-w-20 items-center justify-center border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/82 transition hover:border-amber-300/45"
                  >
                    {isPending && pendingId === reading.id ? "..." : dictionary.readings.delete}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="inline-flex min-w-20 items-center justify-center border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/52 transition hover:text-ivory"
                  >
                    {dictionary.readings.cancel}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!result}
                    onClick={() => {
                      if (!result) {
                        return;
                      }

                      window.sessionStorage.setItem(CHART_RESULT_KEY, JSON.stringify(result));
                      router.push("/resultado");
                    }}
                    className="inline-flex min-w-24 items-center justify-center border border-dusty-gold/24 bg-dusty-gold/[0.055] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82 transition hover:border-dusty-gold/42 hover:bg-dusty-gold/[0.085] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dictionary.readings.open}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(reading.id)}
                    className="inline-flex min-w-24 items-center justify-center border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/42 transition hover:border-amber-300/28 hover:text-amber-100/78"
                  >
                    {dictionary.readings.delete}
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
