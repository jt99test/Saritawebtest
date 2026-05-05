"use client";

import { useEffect, useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { NatalChartData } from "@/lib/chart";
import type { LunarReportMetadata } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";
import {
  getPersonalizedYogaRoutine,
  type PersonalizedYogaRoutine,
  type RoutineElement,
} from "@/lib/personalized-yoga";

const ELEMENT_LABELS: Record<RoutineElement, string> = {
  fuego: "Fuego",
  tierra: "Tierra",
  agua: "Agua",
  aire: "Aire",
};

type MonthlyRoutineCardProps = {
  chart: NatalChartData;
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
};

function routineTitle(routine: PersonalizedYogaRoutine | null) {
  if (!routine) return "Tu rutina de yoga";
  if (routine.secondary) {
    return `${ELEMENT_LABELS[routine.primary]} ${routine.primaryPercent}% + ${ELEMENT_LABELS[routine.secondary]} ${routine.secondaryPercent}%`;
  }

  return `Elemento ${ELEMENT_LABELS[routine.primary]}`;
}

function routineDescription(routine: PersonalizedYogaRoutine | null) {
  if (!routine) {
    return "Una secuencia elegida desde tu carta para acompasar cuerpo, respiración y foco.";
  }

  if (routine.secondary) {
    return `Tu práctica de este mes combina ${ELEMENT_LABELS[routine.primary]} y ${ELEMENT_LABELS[routine.secondary]}: el elemento dominante marca la base y el segundo elemento ajusta el ritmo de la secuencia.`;
  }

  return `Tu práctica de este mes toma ${ELEMENT_LABELS[routine.primary]} como base para elegir las posturas que mejor acompañan tu lectura.`;
}

export function MonthlyRoutineCard({ chart, dictionary }: MonthlyRoutineCardProps) {
  const [routine, setRoutine] = useState<PersonalizedYogaRoutine | null>(null);

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
        {routineTitle(routine)}
      </h3>

      <p className="mt-7 max-w-[560px] font-serif text-[21px] leading-[1.6] text-ivory/82">
        {routineDescription(routine)}
      </p>

      {routineNames ? (
        <p className="mt-5 max-w-[620px] font-serif text-sm italic leading-7 text-[#3a3048]">
          {routineNames} · {routine?.asanas.length ?? 0} asanas
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
