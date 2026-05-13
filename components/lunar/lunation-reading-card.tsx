"use client";

import { PrimaryButton } from "@/components/ui/primary-button";
import { PremiumCard } from "@/components/ui/premium-card";
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
    <section className="mx-auto max-w-[680px]">
      <div className="mt-6">
        {loading ? (
          <PremiumCard className="mx-auto animate-pulse p-5">
            <div className="mb-4 h-[3px] w-12 rounded-full bg-dusty-gold/50" />
            <div className="h-3 w-24 rounded bg-black/8" />
            <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-black/6" />
              <div className="h-3 w-5/6 rounded bg-black/6" />
              <div className="h-3 w-4/6 rounded bg-black/6" />
            </div>
          </PremiumCard>
        ) : error ? (
          <div className="mt-4 space-y-4 text-left">
            <PremiumCard className="p-5">
              <div className="mb-4 h-[3px] w-12 rounded-full bg-dusty-gold/50" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {dictionary.lunar.personalizedReading}
              </p>
              <p className="mt-3 font-serif text-[17px] leading-8 text-[#3a3048]">{error}</p>
            </PremiumCard>
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
          <PremiumCard className="p-5 sm:p-6">
            <div className="mb-4 h-[3px] w-12 rounded-full bg-dusty-gold/50" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              {dictionary.lunar.personalizedReading}
            </p>
            <RenderedReading
              text={prose}
              className="mx-auto mt-4 max-w-none text-left font-serif text-[17px] leading-[1.72] text-[#1e1a2e]"
              paragraphClassName="mb-4"
            />
          </PremiumCard>
        ) : (
          <PremiumCard className="mx-auto animate-pulse p-5">
            <div className="mb-4 h-[3px] w-12 rounded-full bg-dusty-gold/50" />
            <div className="h-3 w-24 rounded bg-black/8" />
            <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-black/6" />
              <div className="h-3 w-5/6 rounded bg-black/6" />
              <div className="h-3 w-4/6 rounded bg-black/6" />
            </div>
          </PremiumCard>
        )}
      </div>
    </section>
  );
}
