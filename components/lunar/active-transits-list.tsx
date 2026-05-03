"use client";

import { useState } from "react";
import { DateTime } from "luxon";

import type { Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata } from "@/lib/lunar-report";

type ActiveTransitsListProps = {
  transits: LunarReportMetadata["activeTransits"];
  timezone: string;
  dictionary: Dictionary;
};

const SLOW_PLANETS = new Set(["Saturno", "Jupiter", "Júpiter", "Urano", "Neptuno", "Pluton", "Plutón"]);

const PLANET_GLYPHS: Record<string, string> = {
  Saturno: "♄",
  Jupiter: "♃",
  Júpiter: "♃",
  Urano: "⛢",
  Neptuno: "♆",
  Pluton: "♇",
  Plutón: "♇",
  Marte: "♂",
  Venus: "♀",
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

export function ActiveTransitsList({ transits, timezone, dictionary }: ActiveTransitsListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const locale = localeFromDictionary(dictionary);

  return (
    <section className="mx-auto max-w-[720px] lg:max-w-[800px]">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {dictionary.lunar.activeTransitsEyebrow}
        </p>
        <h3 className="mt-1.5 font-serif text-[32px] font-normal leading-tight text-ivory">
          {dictionary.lunar.activeTransitsTitle}
        </h3>
      </div>

      {transits.length === 0 ? (
        <p className="mt-8 text-center font-serif text-base italic text-[#3a3048]">
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
                    "border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                    active
                      ? "border-dusty-gold/60 bg-dusty-gold/[0.07] text-[#5c4a24]"
                      : "border-black/10 bg-white text-[#3a3048] hover:bg-black/[0.02]",
                  ].join(" ")}
                >
                  {`${PLANET_GLYPHS[transit.transitingPlanetLabel] ?? "•"} ${transit.transitingPlanetLabel}`}
                </button>
              );
            })}
          </div>

          {(() => {
            const transit = transits[selectedIndex];
            if (!transit) return null;
            const body = getThemeLabel(transit);
            return (
              <article className="mt-4 border border-black/10 bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                  {`${transit.transitingPlanetLabel} ${transit.aspectLabel.toLowerCase()} ${transit.natalPlanetLabel}`}
                </p>
                <p className="mt-1 font-serif text-[13px] italic text-[#3a3048]">
                  {getTransitWindowLabel(transit.exactnessDate, transit.transitingPlanetLabel, timezone, locale)}
                </p>
                {body ? (
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                      {dictionary.lunar.activeTransitMeaning}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#3a3048]">{body}</p>
                  </div>
                ) : null}
              </article>
            );
          })()}
        </>
      )}
    </section>
  );
}
