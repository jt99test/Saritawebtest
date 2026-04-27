import { DateTime } from "luxon";

import type { LunarReportMetadata } from "@/lib/lunar-report";

type ActiveTransitsListProps = {
  transits: LunarReportMetadata["activeTransits"];
  timezone: string;
};

const SLOW_PLANETS = new Set(["Saturno", "Júpiter", "Urano", "Neptuno", "Plutón"]);

const PLANET_GLYPHS: Record<string, string> = {
  Saturno: "♄",
  Júpiter: "♃",
  Urano: "⛢",
  Neptuno: "♆",
  Plutón: "♇",
  Marte: "♂",
  Venus: "♀",
};

function getTransitWindowLabel(exactnessDate: string, planet: string, timezone: string) {
  const exact = DateTime.fromISO(exactnessDate, { zone: "utc" }).setZone(timezone).setLocale("es");
  const offsetDays = SLOW_PLANETS.has(planet) ? 21 : 4;
  const start = exact.minus({ days: offsetDays });
  const end = exact.plus({ days: offsetDays });

  return `del ${start.toFormat("d 'de' LLLL")} al ${end.toFormat("d 'de' LLLL")}`;
}

function getThemeLabel(transit: LunarReportMetadata["activeTransits"][number]) {
  const source = transit.relevance || transit.description;
  const [first] = source.split(",");
  return first.trim().toLowerCase() || "movimiento";
}

export function ActiveTransitsList({
  transits,
  timezone,
}: ActiveTransitsListProps) {
  return (
    <section className="mx-auto max-w-[720px] lg:max-w-[800px]">
      <div className="text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          lo que también se mueve
        </p>
        <h3 className="mt-2 font-serif text-[32px] font-normal leading-tight text-white lg:text-[40px]">
          Tránsitos activos este mes
        </h3>
      </div>

      {transits.length === 0 ? (
        <p className="mt-14 text-center font-serif text-base italic text-white/50">
          Mes tranquilo en el cielo. Aprovecha la calma.
        </p>
      ) : (
        <div className="mt-14">
          {transits.slice(0, 3).map((transit) => (
            <div
              key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
              className="grid grid-cols-[48px_minmax(0,1fr)] gap-6 border-t-[0.5px] border-dusty-gold/12 py-6 last:border-b-[0.5px] sm:grid-cols-[48px_minmax(0,1fr)_140px] lg:grid-cols-[64px_minmax(0,1fr)_200px] lg:gap-8 lg:py-8"
            >
              <p className="text-center font-serif text-2xl leading-none text-white/60 lg:text-[28px]">
                {PLANET_GLYPHS[transit.transitingPlanetLabel] ?? "•"}
              </p>
              <div>
                <p className="font-serif text-lg leading-tight text-white lg:text-[20px]">
                  {`${transit.transitingPlanetLabel} ${transit.aspectLabel.toLowerCase()} ${transit.natalPlanetLabel}`}
                </p>
                <p className="mt-1 font-serif text-[13px] italic leading-6 text-white/50">
                  {getTransitWindowLabel(
                    transit.exactnessDate,
                    transit.transitingPlanetLabel,
                    timezone,
                  )}
                </p>
              </div>
              <p className="col-span-2 font-serif text-[13px] italic leading-6 text-dusty-gold/70 sm:col-span-1 sm:text-right lg:text-sm">
                {getThemeLabel(transit)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
