"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";
import { PremiumCard } from "@/components/ui/premium-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import type { NatalChartData } from "@/lib/chart";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localizeAsana } from "@/data/sarita/yoga-routine-localization";
import {
  getPersonalizedYogaRoutine,
  type PersonalizedYogaRoutine,
  type RoutineElement,
} from "@/lib/personalized-yoga";

const ELEMENT_META: Record<RoutineElement, { badgeClass: string }> = {
  fuego: { badgeClass: "border-[#f5d782]/38 bg-[#f5d782]/12 text-[#f5d782]" },
  tierra: { badgeClass: "border-[#d7e7ff]/28 bg-[#d7e7ff]/8 text-[#d7e7ff]" },
  agua: { badgeClass: "border-[#7cbfff]/36 bg-[#0066ff]/12 text-[#7cbfff]" },
  aire: { badgeClass: "border-[#d7e7ff]/24 bg-[#071437]/72 text-[#d7e7ff]" },
};

type YogaAstralPageProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  locale: Locale;
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

function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function routineTitle(routine: PersonalizedYogaRoutine, copy: Dictionary["yogaAstral"]) {
  const elementLabels = copy.elementLabels;
  const parts = [
    `${elementLabels[routine.primary]} ${routine.primaryPercent}%`,
    routine.secondary ? `${elementLabels[routine.secondary]} ${routine.secondaryPercent}%` : null,
    routine.accent ? `${elementLabels[routine.accent]} ${routine.accentPercent}%` : null,
  ].filter(Boolean);

  if (parts.length > 1) {
    return parts.join(" + ");
  }

  if (routine.secondary) {
    return `${elementLabels[routine.primary]} ${routine.primaryPercent}% + ${elementLabels[routine.secondary]} ${routine.secondaryPercent}%`;
  }

  return formatTemplate(copy.elementTitle, { element: elementLabels[routine.primary] });
}

export function YogaAstralPage({ chart, dictionary, locale }: YogaAstralPageProps) {
  const [routine, setRoutine] = useState<PersonalizedYogaRoutine | null>(null);
  const copy = dictionary.yogaAstral;

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
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#f5d782]">{copy.title}</p>
          <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:text-6xl">
            {copy.loadingTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#e8f3ff]/82">
            {copy.loadingBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 pt-6 sm:space-y-10 sm:pb-20 sm:pt-10">
      <header className="border-t border-[rgba(181,163,110,0.15)] pt-6 sm:pt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#f5d782]">{copy.title}</p>
        <h1 className="mt-3 font-serif text-[38px] leading-tight text-ivory sm:mt-4 sm:text-6xl">
          {routineTitle(routine, copy)}
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-[#e8f3ff]/82">
          {copy.intro}
        </p>
      </header>

      <section className="space-y-5">
        <SectionHeader>{copy.sequence} · {routine.monthKey}</SectionHeader>
        <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-[#d7e7ff]/14 bg-[#030814]/86 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.28),0_0_28px_rgba(0,102,255,0.12)] backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-[#fffdf8]/84">
            <span>{routine.secondary || routine.accent ? copy.combinedRoutine : copy.personalizedRoutine}</span>
            <span>{routine.asanas.length} {copy.asanas}</span>
          </div>
          <div className="mt-2 h-px w-full bg-[#d7e7ff]/12">
            <div className="h-full bg-[#f5d782] shadow-[0_0_12px_rgba(245,215,130,0.34)]" style={{ width: "100%" }} />
          </div>
        </div>

        <ol className="space-y-6">
          {routine.asanas.map((sourceAsana, index) => {
            const asana = localizeAsana(sourceAsana, locale);
            const reverse = index % 2 === 1;
            return (
              <li key={`${asana.element}-${asana.slug}-${index}`}>
                <PremiumCard className="overflow-hidden border-[#d7e7ff]/14 bg-[#061331]/42 shadow-[0_20px_54px_rgba(0,0,0,0.28),0_0_36px_rgba(0,102,255,0.1)]">
                  <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                    <div className={`border-b border-[#d7e7ff]/12 bg-[#071437]/68 p-4 sm:p-5 lg:border-b-0 ${reverse ? "lg:order-2 lg:border-l" : "lg:border-r"}`}>
                      <AsanaVisual
                        asana={asana}
                        tone={asana.element}
                        missingImageLabel={locale === "en" ? "No photo available" : locale === "it" ? "Foto non disponibile" : "Sin foto disponible"}
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dusty-gold/28 bg-dusty-gold/10 font-serif text-xl text-[#f5d782]">
                          {index + 1}
                        </span>
                        <span className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${ELEMENT_META[asana.element].badgeClass}`}>
                          {copy.elementLabels[asana.element]}
                        </span>
                        <span className="rounded-full border border-dusty-gold/25 bg-dusty-gold/12 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f5d782]">
                          {asana.duration}
                        </span>
                      </div>
                      <h3 className="mt-5 font-serif text-2xl leading-tight text-ivory sm:text-3xl">{asana.nameSpanish}</h3>
                      {asana.nameSanskrit !== asana.nameSpanish ? (
                        <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[#d7e7ff]/66">
                          {asana.nameSanskrit}
                        </p>
                      ) : null}
                      <p className="mt-5 text-sm leading-7 text-[#e8f3ff]/82">
                        {asana.description}
                      </p>
                      <div className="mt-5 rounded-[1rem] border border-[#f5d782]/24 bg-[#030814]/52 p-4 text-sm leading-7 text-[#e8f3ff]/82 shadow-[0_0_24px_rgba(0,102,255,0.1),inset_0_0_0_1px_rgba(255,250,240,0.06)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5d782]">
                          {copy.precaution}
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

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-[#d7e7ff]/12 pt-6 sm:flex-row sm:items-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[#d7e7ff]/72">{copy.ready}</p>
        <RoutineCompletionButton storageKey={`sarita:yoga:personalizada:${routine.monthKey}:${routine.id}:completed`} />
      </footer>

      <section className="border-t border-dusty-gold/16 pt-8 sm:pt-10">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#f5d782]">
          {copy.extra}
        </p>
        <div className="mt-4 flex flex-col justify-between gap-6 border border-[#d7e7ff]/14 bg-[#061331]/42 p-6 shadow-[0_20px_54px_rgba(0,0,0,0.26),0_0_34px_rgba(0,102,255,0.1)] sm:flex-row sm:items-end sm:p-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#f5d782]">{copy.kriya}</p>
            <h2 className="mt-3 font-serif text-[34px] leading-tight text-ivory sm:text-[42px]">
              {copy.lavadoTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#e8f3ff]/82">
              {copy.lavadoDescription}
            </p>
          </div>
          <PrimaryButton
            href="/yoga-astral/kriyas/lavado-intestinal"
            variant="ghostGold"
            className="self-start px-6 py-3 text-[12px] uppercase tracking-[0.2em] sm:self-auto"
          >
            {copy.viewExtra}
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
