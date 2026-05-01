"use client";

import { PrimaryButton } from "@/components/ui/primary-button";
import { RenderedReading } from "@/components/ui/rendered-reading";
import type { Dictionary } from "@/lib/i18n";

type LunationReadingCardProps = {
  prose: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  dictionary: Dictionary;
};

export function LunationReadingCard({
  prose,
  loading,
  error,
  onRetry,
  dictionary,
}: LunationReadingCardProps) {
  return (
    <section className="mx-auto max-w-[680px] text-center">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {dictionary.lunar.personalizedReading}
      </p>

      <div className="mt-6">
        {loading ? (
          <article className="mx-auto animate-pulse border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="h-3 w-24 rounded bg-black/8" />
            <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-black/6" />
              <div className="h-3 w-5/6 rounded bg-black/6" />
              <div className="h-3 w-4/6 rounded bg-black/6" />
            </div>
          </article>
        ) : error ? (
          <div className="mt-4 space-y-4">
            <p className="font-serif text-[17px] leading-8 text-[#3a3048]">{error}</p>
            <PrimaryButton
              type="button"
              onClick={onRetry}
              variant="ghostGold"
              className="mt-2 min-w-52 px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
            >
              {dictionary.chart.retry}
            </PrimaryButton>
          </div>
        ) : prose ? (
          <RenderedReading
            text={prose}
            className="mx-auto mt-2 max-w-none text-left font-serif text-[17px] leading-[1.72] text-ivory/88"
            paragraphClassName="mb-4"
          />
        ) : (
          <article className="mx-auto animate-pulse border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="h-3 w-24 rounded bg-black/8" />
            <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-black/6" />
              <div className="h-3 w-5/6 rounded bg-black/6" />
              <div className="h-3 w-4/6 rounded bg-black/6" />
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
