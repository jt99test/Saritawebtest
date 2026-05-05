"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { NatalChartData } from "@/lib/chart";
import {
  getPersonalizedYogaRoutine,
  type PersonalizedYogaRoutine,
  type RoutineElement,
} from "@/lib/personalized-yoga";
import { PrimaryButton } from "@/components/ui/primary-button";
import { illustrations } from "@/data/illustrations";

const ELEMENT_LABELS: Record<RoutineElement, string> = {
  fuego: "Fuego",
  tierra: "Tierra",
  agua: "Agua",
  aire: "Aire",
};

const ELEMENT_ALT_TEXT: Record<RoutineElement, string> = {
  fuego: "Ilustración del elemento Fuego",
  tierra: "Ilustración del elemento Tierra",
  agua: "Ilustración del elemento Agua",
  aire: "Ilustración del elemento Aire",
};

type YogaAstralPageProps = {
  chart: NatalChartData;
};

function routineTitle(routine: PersonalizedYogaRoutine | null) {
  if (!routine) return "Tu rutina astral";
  if (routine.secondary) {
    return `${ELEMENT_LABELS[routine.primary]} ${routine.primaryPercent}% + ${ELEMENT_LABELS[routine.secondary]} ${routine.secondaryPercent}%`;
  }
  return `Elemento ${ELEMENT_LABELS[routine.primary]}`;
}

function routineDescription(routine: PersonalizedYogaRoutine | null) {
  if (!routine) {
    return "Estamos preparando la secuencia que corresponde a tu carta.";
  }

  if (routine.secondary) {
    return `Una práctica combinada de ${ELEMENT_LABELS[routine.primary]} y ${ELEMENT_LABELS[routine.secondary]}, elegida desde tu carta para ordenar cuerpo, respiración y foco.`;
  }

  return `Una práctica de ${ELEMENT_LABELS[routine.primary]} elegida desde tu carta para acompañar tu energía corporal actual.`;
}

export function YogaAstralPage({ chart }: YogaAstralPageProps) {
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

  const primaryElement = routine?.primary ?? "aire";
  const previewAsanas = routine?.asanas.slice(0, 4).map((asana) => asana.nameSanskrit).join(" · ");

  return (
    <div className="pb-16 pt-8 sm:pb-24 sm:pt-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          yoga astral
        </p>
        <h1 className="mt-2 font-serif text-[42px] font-normal leading-none text-ivory sm:text-[64px] lg:text-[78px]">
          Tu cuerpo como mapa.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-sm leading-7 text-[#3a3048] sm:text-base sm:leading-8">
          Aquí encuentras solo lo importante: tu rutina personalizada según la lectura de tu carta y el protocolo de lavado intestinal corto.
        </p>
      </header>

      <section className="mx-auto mt-10 grid max-w-[980px] gap-5 sm:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <article className="overflow-hidden border border-black/10 bg-white shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
          <div className="grid gap-0 md:grid-cols-[0.82fr_1fr]">
            <div className="flex items-center justify-center border-b border-black/10 bg-[#f8f4eb]/70 p-6 md:border-b-0 md:border-r">
              <Image
                src={illustrations.elements[primaryElement]}
                alt={ELEMENT_ALT_TEXT[primaryElement]}
                width={360}
                height={360}
                priority
                className="h-auto w-full max-w-[240px] sm:max-w-[300px]"
                sizes="(max-width: 768px) 70vw, 300px"
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#8a7a4e]">
                rutina personalizada
              </p>
              <h2 className="mt-3 font-serif text-[34px] leading-tight text-ivory sm:text-[42px]">
                {routineTitle(routine)}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#3a3048]">
                {routineDescription(routine)}
              </p>
              {previewAsanas ? (
                <p className="mt-5 font-serif text-sm italic leading-7 text-[#5c4a24]">
                  {previewAsanas}
                </p>
              ) : null}
              <PrimaryButton
                href="/yoga-astral/personalizada"
                variant="ghostGold"
                className="mt-7 self-start px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
              >
                Ver mi rutina
              </PrimaryButton>
            </div>
          </div>
        </article>

        <article className="flex flex-col justify-between border border-dusty-gold/18 bg-dusty-gold/[0.055] p-6 shadow-[0_16px_44px_rgba(30,26,46,0.06)] sm:p-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#8a7a4e]">
              kriya
            </p>
            <h2 className="mt-3 font-serif text-[34px] leading-tight text-ivory sm:text-[42px]">
              Lavado intestinal corto
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#3a3048]">
              Protocolo de Laghoo Shankhaprakshala: preparación, práctica, precauciones y dieta de apoyo en una guía limpia y directa.
            </p>
          </div>
          <PrimaryButton
            href="/yoga-astral/kriyas/lavado-intestinal"
            variant="ghostGold"
            className="mt-7 self-start px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
          >
            Ver protocolo
          </PrimaryButton>
        </article>
      </section>
    </div>
  );
}
