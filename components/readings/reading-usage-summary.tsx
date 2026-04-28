"use client";

import { useState } from "react";

import {
  defaultLocale,
  dictionaries,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n";

type ReadingUsageSummaryProps = {
  plan: string;
  count: number;
  limit: number;
};

export function ReadingUsageSummary({ plan, count, limit }: ReadingUsageSummaryProps) {
  const [locale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return storedLocale && isLocale(storedLocale) ? storedLocale : defaultLocale;
  });
  const dictionary = dictionaries[locale];
  const planLabels = dictionary.readings.planNames;
  const planLabel = planLabels[plan as keyof typeof planLabels] ?? plan;

  return (
    <div className="mt-6 grid gap-3 border-y border-white/8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/45 sm:grid-cols-2">
      <p>
        {dictionary.readings.planLabel}{" "}
        <span className="text-dusty-gold/70">{planLabel}</span>
      </p>
      <p className="sm:text-right">
        {dictionary.readings.thisMonth}{" "}
        <span className="text-dusty-gold/70">
          {count} / {limit}
        </span>
      </p>
    </div>
  );
}
