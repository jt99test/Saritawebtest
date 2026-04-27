import SwissEph from "swisseph-wasm";
import { DateTime } from "luxon";

import type { AspectId, ChartPointId, NatalChartData } from "@/lib/chart";
import { normalizeLongitude } from "@/lib/chart";

const SEFLG_SPEED = 256, SEFLG_SWIEPH = 2;

const SE_BODIES: Record<string, number> = {
  saturn: 6, jupiter: 5, uranus: 7, neptune: 8, pluto: 9, mars: 4, venus: 3,
};

let _se: SwissEph | null = null;
let _init: Promise<SwissEph> | null = null;

async function initSwisseph(): Promise<SwissEph> {
  if (_se) return _se;
  if (!_init) {
    _init = (async () => {
      const se = new SwissEph();
      await se.initSwissEph();
      _se = se;
      return se;
    })();
  }
  return _init;
}

function ephemerisFlag(): number {
  return SEFLG_SPEED | SEFLG_SWIEPH;
}

export type TransitingPoint = {
  id: ChartPointId;
  longitude: number;
  longitudeSpeed: number;
  retrograde: boolean;
};

export type ActiveTransit = {
  transitingPlanet: ChartPointId;
  natalPlanet: ChartPointId;
  aspectType: AspectId;
  orb: number;
  exactnessDate: string;
  strength: "tight" | "moderate" | "wide";
};

type SupportedTransitPlanet =
  | "saturn" | "jupiter" | "uranus" | "neptune" | "pluto" | "mars" | "venus";

type TransitRule = {
  aspects: Array<{ type: AspectId; angle: number }>;
  orb: number;
  searchWindowDays: number;
};

const TRANSIT_PLANETS: Array<{ id: SupportedTransitPlanet; body: number }> = [
  { id: "saturn",  body: SE_BODIES.saturn  },
  { id: "jupiter", body: SE_BODIES.jupiter },
  { id: "uranus",  body: SE_BODIES.uranus  },
  { id: "neptune", body: SE_BODIES.neptune },
  { id: "pluto",   body: SE_BODIES.pluto   },
  { id: "mars",    body: SE_BODIES.mars    },
  { id: "venus",   body: SE_BODIES.venus   },
];

const TRANSIT_RULES: Record<SupportedTransitPlanet, TransitRule> = {
  saturn:  { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }, { type: "square", angle: 90 }, { type: "trine", angle: 120 }], orb: 2, searchWindowDays: 60 },
  jupiter: { aspects: [{ type: "conjunction", angle: 0 }, { type: "trine", angle: 120 }, { type: "sextile", angle: 60 }], orb: 2, searchWindowDays: 45 },
  uranus:  { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }, { type: "square", angle: 90 }], orb: 1.5, searchWindowDays: 90 },
  neptune: { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }, { type: "square", angle: 90 }], orb: 1.5, searchWindowDays: 90 },
  pluto:   { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }, { type: "square", angle: 90 }], orb: 1.5, searchWindowDays: 120 },
  mars:    { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }], orb: 2, searchWindowDays: 14 },
  venus:   { aspects: [{ type: "conjunction", angle: 0 }, { type: "opposition", angle: 180 }], orb: 2, searchWindowDays: 14 },
};

function toJulianDay(se: SwissEph, date: Date): number {
  const dt = DateTime.fromJSDate(date, { zone: "utc" });
  return se.julday(dt.year, dt.month, dt.day,
    dt.hour + dt.minute / 60 + dt.second / 3600 + dt.millisecond / 3600000);
}

function angularDistance(first: number, second: number) {
  const difference = Math.abs(normalizeLongitude(first - second));
  return difference > 180 ? 360 - difference : difference;
}

function aspectDistance(first: number, second: number, angle: number) {
  return Math.abs(angularDistance(first, second) - angle);
}

function toStrength(orb: number, maxOrb: number): ActiveTransit["strength"] {
  if (orb <= maxOrb / 3) return "tight";
  if (orb <= (maxOrb * 2) / 3) return "moderate";
  return "wide";
}

function getPlanetLongitude(se: SwissEph, planet: SupportedTransitPlanet, date: Date) {
  const body = TRANSIT_PLANETS.find((entry) => entry.id === planet)!.body;
  const arr = se.calc_ut(toJulianDay(se, date), body, ephemerisFlag()) as Float64Array;
  return { longitude: normalizeLongitude(arr[0]!), longitudeSpeed: arr[3]! };
}

function findExactnessDate(se: SwissEph, planet: SupportedTransitPlanet, natalLongitude: number, angle: number, aroundDate: Date) {
  const { searchWindowDays } = TRANSIT_RULES[planet];
  const center = DateTime.fromJSDate(aroundDate, { zone: "utc" });
  let best = { date: center.toJSDate(), orb: Number.POSITIVE_INFINITY };

  for (let hours = -searchWindowDays * 24; hours <= searchWindowDays * 24; hours += 6) {
    const candidate = center.plus({ hours }).toJSDate();
    const orb = aspectDistance(getPlanetLongitude(se, planet, candidate).longitude, natalLongitude, angle);
    if (orb < best.orb) best = { date: candidate, orb };
  }

  const refinementCenter = DateTime.fromJSDate(best.date, { zone: "utc" });
  for (let minutes = -360; minutes <= 360; minutes += 10) {
    const candidate = refinementCenter.plus({ minutes }).toJSDate();
    const orb = aspectDistance(getPlanetLongitude(se, planet, candidate).longitude, natalLongitude, angle);
    if (orb < best.orb) best = { date: candidate, orb };
  }

  return DateTime.fromJSDate(best.date, { zone: "utc" }).toISO({ suppressMilliseconds: true, includeOffset: false }) + "Z";
}

export async function getTransitingPositions(date: Date): Promise<TransitingPoint[]> {
  const se = await initSwisseph();
  const jd = toJulianDay(se, date);
  const flags = ephemerisFlag();
  return TRANSIT_PLANETS.map((planet) => {
    const arr = se.calc_ut(jd, planet.body, flags) as Float64Array;
    return {
      id: planet.id,
      longitude: normalizeLongitude(arr[0]!),
      longitudeSpeed: arr[3]!,
      retrograde: arr[3]! < 0,
    };
  });
}

export async function getActiveTransits(natalChart: NatalChartData, date: Date): Promise<ActiveTransit[]> {
  const se = await initSwisseph();
  const jd = toJulianDay(se, date);
  const flags = ephemerisFlag();
  const transits = TRANSIT_PLANETS.map((planet) => {
    const arr = se.calc_ut(jd, planet.body, flags) as Float64Array;
    return { id: planet.id as SupportedTransitPlanet, longitude: normalizeLongitude(arr[0]!), longitudeSpeed: arr[3]! };
  });

  const results: ActiveTransit[] = [];
  for (const transit of transits) {
    const rules = TRANSIT_RULES[transit.id];
    for (const natalPoint of natalChart.points) {
      for (const aspect of rules.aspects) {
        const orb = aspectDistance(transit.longitude, natalPoint.longitude, aspect.angle);
        if (orb <= rules.orb) {
          results.push({
            transitingPlanet: transit.id,
            natalPlanet: natalPoint.id,
            aspectType: aspect.type,
            orb: Math.round(orb * 100) / 100,
            exactnessDate: findExactnessDate(se, transit.id, natalPoint.longitude, aspect.angle, date),
            strength: toStrength(orb, rules.orb),
          });
        }
      }
    }
  }
  return results.sort((a, b) => a.orb - b.orb);
}
