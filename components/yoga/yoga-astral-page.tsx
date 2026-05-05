"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { PremiumCard } from "@/components/ui/premium-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import type { NatalChartData } from "@/lib/chart";
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

const ELEMENT_META: Record<RoutineElement, { badgeClass: string }> = {
  fuego: { badgeClass: "border-[#b66a4c]/30 bg-[#b66a4c]/10 text-[#793b2a]" },
  tierra: { badgeClass: "border-[#6f7f59]/30 bg-[#6f7f59]/10 text-[#435032]" },
  agua: { badgeClass: "border-[#5f8390]/30 bg-[#5f8390]/10 text-[#36515c]" },
  aire: { badgeClass: "border-[#7971a7]/30 bg-[#7971a7]/10 text-[#514a78]" },
};

type YogaAstralPageProps = {
  chart: NatalChartData;
};

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-[2rem] leading-tight text-ivory sm:text-[2.35rem]">
        {children}
      </h2>
      <div className="mt-3 h-0.5 w-10 rounded-full bg-dusty-gold/70" />
    </div>
  );
}

function routineTitle(routine: PersonalizedYogaRoutine) {
  if (routine.secondary) {
    return `${ELEMENT_LABELS[routine.primary]} ${routine.primaryPercent}% + ${ELEMENT_LABELS[routine.secondary]} ${routine.secondaryPercent}%`;
  }

  return `Elemento ${ELEMENT_LABELS[routine.primary]}`;
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

  if (!routine) {
    return (
      <div className="flex min-h-[52vh] items-center justify-center pb-16 pt-8 text-center sm:pb-24 sm:pt-16">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">Yoga astral</p>
          <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:text-6xl">
            Preparando tu rutina
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#3a3048]">
            Estamos eligiendo las posturas que mejor acompañan la lectura de tu carta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 pt-6 sm:space-y-10 sm:pb-20 sm:pt-10">
      <header className="border-t border-[rgba(181,163,110,0.15)] pt-6 sm:pt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#3a3048]">Yoga astral</p>
        <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
          {routineTitle(routine)}
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-[#3a3048]">
          Esta secuencia nace de tu carta: toma tu elemento dominante como punto de partida y selecciona las posturas que mejor acompañan tu energía actual. Cada asana está elegida para ordenar el cuerpo, la respiración y el foco desde tu propia lectura.
        </p>
      </header>

      <section className="space-y-5">
        <SectionHeader>La secuencia · {routine.monthKey}</SectionHeader>
        <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-dusty-gold/16 bg-[#f5f0e6]/94 px-4 py-3 shadow-[0_12px_34px_rgba(30,26,46,0.08)] backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
            <span>{routine.secondary ? "Rutina combinada" : "Rutina personalizada"}</span>
            <span>{routine.asanas.length} asanas</span>
          </div>
          <div className="mt-2 h-0.5 w-full bg-black/8">
            <div className="h-full bg-dusty-gold/60" style={{ width: "100%" }} />
          </div>
        </div>

        <ol className="space-y-6">
          {routine.asanas.map((asana, index) => {
            const reverse = index % 2 === 1;
            return (
              <li key={`${asana.element}-${asana.slug}-${index}`}>
                <PremiumCard className="overflow-hidden border-black/10 bg-white/88 shadow-[0_16px_44px_rgba(30,26,46,0.08)]">
                  <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                    <div className={`border-b border-black/10 bg-[#f8f4eb]/70 p-4 sm:p-5 lg:border-b-0 ${reverse ? "lg:order-2 lg:border-l" : "lg:border-r"}`}>
                      <AsanaVisual asana={asana} tone={asana.element} />
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#5c4a24]">
                          {index + 1}
                        </span>
                        <span className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}>
                          {ELEMENT_LABELS[asana.element]}
                        </span>
                        <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]">
                          {asana.duration}
                        </span>
                      </div>
                      <h3 className="mt-5 font-serif text-2xl leading-tight text-ivory sm:text-3xl">{asana.nameSanskrit}</h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#3a3048]">{asana.nameSpanish}</p>
                      <p className="mt-5 text-sm leading-7 text-[#3a3048]">{asana.description}</p>
                      <div className="mt-5 rounded-[1rem] border border-dusty-gold/26 bg-[#f8f4eb] p-4 text-sm leading-7 text-[#3a3048] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f5a2a]">
                          Precaución
                        </p>
                        <p className="mt-2">{asana.warning}</p>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[#3a3048]">Rutina lista para practicar</p>
        <RoutineCompletionButton storageKey={`sarita:yoga:personalizada:${routine.monthKey}:completed`} />
      </footer>

      <section className="border-t border-dusty-gold/16 pt-8 sm:pt-10">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          extra
        </p>
        <div className="mt-4 flex flex-col justify-between gap-6 border border-dusty-gold/18 bg-dusty-gold/[0.055] p-6 shadow-[0_16px_44px_rgba(30,26,46,0.06)] sm:flex-row sm:items-end sm:p-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#8a7a4e]">kriya</p>
            <h2 className="mt-3 font-serif text-[34px] leading-tight text-ivory sm:text-[42px]">
              Lavado intestinal corto
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#3a3048]">
              Un protocolo aparte de Laghoo Shankhaprakshala con preparación, práctica, precauciones y dieta de apoyo.
            </p>
          </div>
          <PrimaryButton
            href="/yoga-astral/kriyas/lavado-intestinal"
            variant="ghostGold"
            className="self-start px-6 py-3 text-[12px] uppercase tracking-[0.2em] sm:self-auto"
          >
            Ver extra
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
