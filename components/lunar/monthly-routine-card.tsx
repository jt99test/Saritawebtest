"use client";

import { useEffect, useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { NatalChartData } from "@/lib/chart";
import type { LunarReportMetadata } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";
import { getPersonalizedYogaRoutine, type PersonalizedYogaRoutine } from "@/lib/personalized-yoga";

type MonthlyRoutineCardProps = {
  chart: NatalChartData;
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
};

function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function routineTitle(routine: PersonalizedYogaRoutine | null, copy: Dictionary["yogaAstral"]) {
  const elementLabels = copy.elementLabels;
  if (!routine) return copy.monthlyFallbackTitle;
  const parts = [
    `${elementLabels[routine.primary]} ${routine.primaryPercent}%`,
    routine.secondary ? `${elementLabels[routine.secondary]} ${routine.secondaryPercent}%` : null,
    routine.accent ? `${elementLabels[routine.accent]} ${routine.accentPercent}%` : null,
  ].filter(Boolean);

  if (parts.length > 1) {
    return parts.join(" + ");
  }

  return formatTemplate(copy.elementTitle, { element: elementLabels[routine.primary] });
}

function routineDescription(routine: PersonalizedYogaRoutine | null, copy: Dictionary["yogaAstral"]) {
  const elementLabels = copy.elementLabels;
  if (!routine) {
    return copy.monthlyFallbackBody;
  }

  if (routine.secondary) {
    return formatTemplate(copy.monthlyCombinedBody, {
      primary: elementLabels[routine.primary],
      secondary: elementLabels[routine.secondary],
    });
  }

  return formatTemplate(copy.monthlySingleBody, { element: elementLabels[routine.primary] });
}

export function MonthlyRoutineCard({ chart, dictionary }: MonthlyRoutineCardProps) {
  const [routine, setRoutine] = useState<PersonalizedYogaRoutine | null>(null);
  const yogaCopy = dictionary.yogaAstral;

  useEffect(() => {
    let cancelled = false;

    void getPersonalizedYogaRoutine(chart).then((nextRoutine) => {
      if (!cancelled) {
        setRoutine(nextRoutine);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  const routineNames = routine?.asanas
    .slice(0, 4)
    .map((asana) => asana.nameSanskrit)
    .join(" · ");

  return (
    <section className="mx-auto max-w-[720px] text-left">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {dictionary.lunar.practiceThisMonth}
      </p>
      <h3 className="mt-2 font-serif text-[36px] font-normal leading-tight text-ivory">
        {routineTitle(routine, yogaCopy)}
      </h3>

      <p className="mt-7 max-w-[560px] font-serif text-[21px] leading-[1.6] text-ivory/82">
        {routineDescription(routine, yogaCopy)}
      </p>

      {routineNames ? (
        <p className="mt-5 max-w-[620px] font-serif text-sm italic leading-7 text-[#3a3048]">
          {routineNames} · {routine?.asanas.length ?? 0} {yogaCopy.asanas}
        </p>
      ) : null}

      <PrimaryButton
        href="/yoga-astral"
        variant="ghostGold"
        className="mt-8 px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
      >
        {dictionary.lunar.seeRoutine}
      </PrimaryButton>
    </section>
  );
}
