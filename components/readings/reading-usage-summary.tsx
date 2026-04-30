"use client";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";

type ReadingUsageSummaryProps = {
  plan: string;
  count: number;
  limit: number;
};

export function ReadingUsageSummary({ plan, count, limit }: ReadingUsageSummaryProps) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const planLabels = dictionary.readings.planNames;
  const planLabel = planLabels[plan as keyof typeof planLabels] ?? plan;
  const usagePercent = Math.min(100, Math.round((count / Math.max(limit, 1)) * 100));

  return (
    <div className="mt-6 border-y border-white/8 py-4">
      <div className="grid gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/45 sm:grid-cols-2">
        <p>
          {dictionary.readings.planLabel}{" "}
          <span className="text-dusty-gold/82">{planLabel}</span>
        </p>
        <p className="sm:text-right">
          {dictionary.readings.thisMonth}{" "}
          <span className="text-dusty-gold/82">
            {count} / {limit}
          </span>
        </p>
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden bg-white/[0.055]"
        aria-label={`${dictionary.readings.thisMonth}: ${count} / ${limit}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={count}
      >
        <div
          className="h-full bg-[linear-gradient(90deg,rgba(181,163,110,0.55),rgba(240,218,151,0.92))] shadow-[0_0_24px_rgba(181,163,110,0.24)] transition-[width]"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </div>
  );
}
