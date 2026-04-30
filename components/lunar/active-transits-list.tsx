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
  return first.trim() || "movimiento";
}

export function ActiveTransitsList({ transits, timezone }: ActiveTransitsListProps) {
  return (
    <section className="mx-auto max-w-[720px] lg:max-w-[800px]">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">
          lo que también se mueve
        </p>
        <h3 className="mt-1.5 font-serif text-[32px] font-normal leading-tight text-white">
          Tránsitos activos este mes
        </h3>
      </div>

      {transits.length === 0 ? (
        <p className="mt-8 text-center font-serif text-base italic text-white/50">
          Mes tranquilo en el cielo. Aprovecha la calma.
        </p>
      ) : (
        <div className="mt-8">
          {transits.slice(0, 3).map((transit) => (
            <div
              key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
              className="grid grid-cols-[42px_minmax(0,1fr)] gap-5 border-t-[0.5px] border-dusty-gold/12 py-4.5 last:border-b-[0.5px] sm:grid-cols-[42px_minmax(0,1fr)_140px] lg:grid-cols-[56px_minmax(0,1fr)_180px] lg:gap-6 lg:py-5"
            >
              <p className="text-center font-serif text-2xl leading-none text-white/85 lg:text-[28px]">
                {PLANET_GLYPHS[transit.transitingPlanetLabel] ?? "•"}
              </p>
              <div>
                <p className="font-serif text-lg leading-tight text-white lg:text-[21px]">
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
              <p className="col-span-2 text-[11px] uppercase leading-6 tracking-[0.14em] text-dusty-gold/82 sm:col-span-1 sm:text-right">
                {getThemeLabel(transit)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
