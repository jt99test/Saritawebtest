"use client";

import { useState } from "react";
import { DateTime } from "luxon";

import { Section } from "@/components/ui/section";
import type { Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata } from "@/lib/lunar-report";

type ActiveTransitsListProps = {
  transits: LunarReportMetadata["activeTransits"];
  timezone: string;
  dictionary: Dictionary;
};

const SLOW_PLANETS = new Set(["saturn", "jupiter", "uranus", "neptune", "pluto"]);

const PLANET_GLYPHS: Record<string, string> = {
  saturn: "♄",
  jupiter: "♃",
  uranus: "⛢",
  neptune: "♆",
  pluto: "♇",
  mars: "♂",
  venus: "♀",
};

function localeFromDictionary(dictionary: Dictionary) {
  if (dictionary.lunar.fullMoon === "Full Moon") return "en";
  if (dictionary.lunar.fullMoon === "Luna Piena") return "it";
  return "es";
}

function getTransitWindowLabel(exactnessDate: string, planet: string, timezone: string, locale: string) {
  const exact = DateTime.fromISO(exactnessDate, { zone: "utc" }).setZone(timezone).setLocale(locale);
  const offsetDays = SLOW_PLANETS.has(planet) ? 21 : 4;
  const start = exact.minus({ days: offsetDays });
  const end = exact.plus({ days: offsetDays });

  if (locale === "en") {
    return `from ${start.toFormat("LLLL d")} to ${end.toFormat("LLLL d")}`;
  }

  if (locale === "it") {
    return `dal ${start.toFormat("d LLLL")} al ${end.toFormat("d LLLL")}`;
  }

  return `del ${start.toFormat("d 'de' LLLL")} al ${end.toFormat("d 'de' LLLL")}`;
}

function getThemeLabel(transit: LunarReportMetadata["activeTransits"][number]) {
  return transit.practicalSummary?.trim() ?? "";
}

function lifecycleTransitLabel(
  transit: Pick<LunarReportMetadata["activeTransits"][number], "lifecycleEvent">,
  locale: string,
) {
  if (!transit.lifecycleEvent) return "";
  const labels: Record<NonNullable<LunarReportMetadata["activeTransits"][number]["lifecycleEvent"]>, Record<"es" | "en" | "it", string>> = {
    "jupiter-return": { es: "Retorno de Júpiter", en: "Jupiter return", it: "Ritorno di Giove" },
    "jupiter-opposition": { es: "Oposición de Júpiter", en: "Jupiter opposition", it: "Opposizione di Giove" },
    "saturn-return": { es: "Retorno de Saturno", en: "Saturn return", it: "Ritorno di Saturno" },
    "saturn-opposition": { es: "Oposición de Saturno", en: "Saturn opposition", it: "Opposizione di Saturno" },
    "uranus-return": { es: "Retorno de Urano", en: "Uranus return", it: "Ritorno di Urano" },
    "uranus-opposition": { es: "Oposición de Urano", en: "Uranus opposition", it: "Opposizione di Urano" },
  };
  const language = locale === "en" || locale === "it" ? locale : "es";
  return labels[transit.lifecycleEvent][language];
}

export function ActiveTransitsList({ transits, timezone, dictionary }: ActiveTransitsListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const locale = localeFromDictionary(dictionary);

  return (
    <Section
      tone="tinted"
      withContainer={false}
      className="sarita-glass-panel mx-auto max-w-[720px] rounded-[1.8rem] px-5 py-7 lg:max-w-[800px] sm:px-7"
    >
      <div className="text-center">
        <p className="sarita-section-label">
          {dictionary.lunar.activeTransitsEyebrow}
        </p>
        <h3 className="sarita-sheen mt-1.5 inline-block font-serif text-[32px] font-normal leading-tight text-[#fffaf0]">
          {dictionary.lunar.activeTransitsTitle}
        </h3>
      </div>

      {transits.length === 0 ? (
        <p className="mt-8 text-center font-serif text-base italic text-[#d7d0ff]/72">
          {dictionary.lunar.quietMonth}
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {transits.slice(0, 3).map((transit, index) => {
              const active = selectedIndex === index;
              return (
                <button
                  key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={[
                    "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                    active
                      ? "border-[#d7bd6a]/70 bg-[#d7bd6a]/12 text-[#d7bd6a]"
                      : "border-[#d7d0ff]/18 bg-transparent text-[#fffaf0]/62 hover:border-[#d7bd6a]/45 hover:text-[#fffaf0]",
                  ].join(" ")}
                >
                  {`${PLANET_GLYPHS[transit.transitingPlanet] ?? "•"} ${transit.transitingPlanetLabel}`}
                </button>
              );
            })}
          </div>

          {(() => {
            const transit = transits[selectedIndex];
            if (!transit) return null;
            const body = getThemeLabel(transit);
            return (
              <article className="mt-4 rounded-[1.6rem] border border-[#d7d0ff]/14 bg-[#070713]/36 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7bd6a]">
                  {lifecycleTransitLabel(transit, locale) ||
                    `${transit.transitingPlanetLabel} ${transit.aspectLabel.toLowerCase()} ${transit.natalPlanetLabel}`}
                </p>
                <p className="mt-1 font-serif text-[13px] italic text-[#d7d0ff]/68">
                {getTransitWindowLabel(transit.exactnessDate, transit.transitingPlanet, timezone, locale)}
                </p>
                {body ? (
                  <div className="mt-4 border-t border-[#d7d0ff]/12 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7bd6a]">
                      {dictionary.lunar.activeTransitMeaning}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#fffaf0]/78">{body}</p>
                  </div>
                ) : null}
              </article>
            );
          })()}
        </>
      )}
    </Section>
  );
}
