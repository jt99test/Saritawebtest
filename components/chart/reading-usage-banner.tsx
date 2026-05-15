"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

import { getReadingUsageAction } from "@/app/lecturas/actions";
import type { Dictionary } from "@/lib/i18n";

export function ReadingUsageBanner({ dictionary }: { dictionary: Dictionary }) {
  const [usage, setUsage] = useState<{ count: number; limit: number; plan: string } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setUsage(await getReadingUsageAction());
    });
  }, []);

  if (usage?.plan !== "free") {
    return null;
  }

  return (
    <div className="mx-auto mb-4 max-w-5xl border border-[#f5d782]/22 bg-[#f5d782]/[0.06] px-4 py-2.5 text-center text-[12px] text-[#d7e7ff]/72 shadow-[0_0_24px_rgba(245,215,130,0.08)]">
      {dictionary.chart.usageBanner
        .replace("{used}", String(usage.count))
        .replace("{limit}", String(usage.limit))}{" "}
      <Link href="/precios" className="text-[#f5d782] underline underline-offset-2">
        {dictionary.chart.seePlans}
      </Link>
    </div>
  );
}
