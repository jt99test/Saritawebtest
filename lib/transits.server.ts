import SwissEph from "swisseph-wasm";
import { DateTime } from "luxon";

import type { AnglePointId, AspectId, ChartPoint, ChartPointId, ChartReferencePointId, NatalChartData } from "@/lib/chart";
import { getHouseForLongitude, getSignFromLongitude, normalizeLongitude, toAbsoluteLongitudeLabel, toZodiacDegreeLabel, getDegreeInSign, getMinutesInSign } from "@/lib/chart";

const SEFLG_SPEED = 256, SEFLG_SWIEPH = 2;

const SE_BODIES: Record<string, number> = {
  saturn: 6,
  jupiter: 5,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  mars: 4,
  venus: 3,
  northNode: 11,
  chiron: 15,
  lilith: 21,
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
  natalPlanet: ChartReferencePointId;
  aspectType: AspectId;
  lifecycleEvent?: "jupiter-return" | "jupiter-opposition" | "saturn-return" | "saturn-opposition" | "uranus-return" | "uranus-opposition";
  orb: number;
  exactnessDate: string;
  strength: "tight" | "moderate" | "wide";
  activatedNatalAspects: Array<{
    pointA: ChartPointId;
    pointB: ChartPointId;
    aspectType: AspectId;
    orb: number;
  }>;
};

type SupportedTransitPlanet =
  | "saturn" | "jupiter" | "uranus" | "neptune" | "pluto" | "mars" | "venus"
  | "northNode" | "southNode" | "chiron" | "lilith";

type TransitRule = {
  aspects: Array<{ type: AspectId; angle: number }>;
  orb: number;
  conjunctionOrb?: number;
  searchWindowDays: number;
};

type TransitTargetPoint = Omit<ChartPoint, "id"> & { id: ChartReferencePointId };

const TRANSIT_PLANETS: Array<{ id: Exclude<SupportedTransitPlanet, "southNode">; body: number }> = [
  { id: "saturn",  body: SE_BODIES.saturn  },
  { id: "jupiter", body: SE_BODIES.jupiter },
  { id: "uranus",  body: SE_BODIES.uranus  },
  { id: "neptune", body: SE_BODIES.neptune },
  { id: "pluto",   body: SE_BODIES.pluto   },
  { id: "mars",    body: SE_BODIES.mars    },
  { id: "venus",   body: SE_BODIES.venus   },
  { id: "northNode", body: SE_BODIES.northNode },
  { id: "chiron", body: SE_BODIES.chiron },
  { id: "lilith", body: SE_BODIES.lilith },
];

const MAJOR_TRANSIT_ASPECTS: TransitRule["aspects"] = [
  { type: "conjunction", angle: 0 },
  { type: "opposition", angle: 180 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "sextile", angle: 60 },
];

const TRANSIT_RULES: Record<SupportedTransitPlanet, TransitRule> = {
  saturn:  { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 60 },
  jupiter: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 45 },
  uranus:  { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 90 },
  neptune: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 90 },
  pluto:   { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 120 },
  mars:    { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 14 },
  venus:   { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 14 },
  northNode: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 90 },
  southNode: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 90 },
  chiron: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 90 },
  lilith: { aspects: MAJOR_TRANSIT_ASPECTS, orb: 5, searchWindowDays: 45 },
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

function getLifecycleEvent(
  transitingPlanet: SupportedTransitPlanet,
  natalPlanet: ChartPointId,
  aspectType: AspectId,
): ActiveTransit["lifecycleEvent"] {
  if (transitingPlanet !== natalPlanet) return undefined;
  if (transitingPlanet !== "jupiter" && transitingPlanet !== "saturn" && transitingPlanet !== "uranus") {
    return undefined;
  }
  if (aspectType === "conjunction") return `${transitingPlanet}-return`;
  if (aspectType === "opposition") return `${transitingPlanet}-opposition`;
  return undefined;
}

function getPlanetLongitude(se: SwissEph, planet: SupportedTransitPlanet, date: Date) {
  const body = planet === "southNode"
    ? SE_BODIES.northNode
    : TRANSIT_PLANETS.find((entry) => entry.id === planet)!.body;
  const arr = se.calc_ut(toJulianDay(se, date), body, ephemerisFlag()) as Float64Array;
  const longitude = planet === "southNode" ? arr[0]! + 180 : arr[0]!;
  return { longitude: normalizeLongitude(longitude), longitudeSpeed: arr[3]! };
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

function natalAspectsForPoint(natalChart: NatalChartData, pointId: ChartPointId): ActiveTransit["activatedNatalAspects"] {
  return natalChart.aspects
    .filter((aspect) => aspect.from === pointId || aspect.to === pointId)
    .filter(
      (aspect): aspect is typeof aspect & { from: ChartPointId; to: ChartPointId } =>
        !isAnglePointId(aspect.from) && !isAnglePointId(aspect.to),
    )
    .sort((left, right) => left.orb - right.orb)
    .map((aspect) => ({
      pointA: aspect.from,
      pointB: aspect.to,
      aspectType: aspect.type,
      orb: aspect.orb,
    }));
}

function isAnglePointId(pointId: ChartReferencePointId): pointId is AnglePointId {
  return pointId === "ascendant" || pointId === "descendant" || pointId === "mc" || pointId === "ic";
}

function buildAngleTargets(natalChart: NatalChartData): TransitTargetPoint[] {
  const angles: Array<{ id: AnglePointId; longitude: number; glyph: string; color: string }> = [
    { id: "ascendant", longitude: natalChart.meta.ascendant, glyph: "AC", color: "#f1d28f" },
    { id: "descendant", longitude: natalChart.meta.descendant, glyph: "DC", color: "#f1d28f" },
    { id: "mc", longitude: natalChart.meta.mc, glyph: "MC", color: "#d7e7ff" },
    { id: "ic", longitude: natalChart.meta.ic, glyph: "IC", color: "#d7e7ff" },
  ];

  return angles.map((angle): TransitTargetPoint => {
    const longitude = normalizeLongitude(angle.longitude);
    return {
      id: angle.id,
      glyph: angle.glyph,
      longitude,
      sign: getSignFromLongitude(longitude),
      degreeLabel: toZodiacDegreeLabel(longitude),
      degreeInSign: getDegreeInSign(longitude),
      minutesInSign: getMinutesInSign(longitude),
      absoluteLongitudeLabel: toAbsoluteLongitudeLabel(longitude),
      house: getHouseForLongitude(longitude, natalChart.houses),
      color: angle.color,
      retrograde: false,
      longitudeSpeed: 0,
    };
  });
}

export async function getTransitingPositions(date: Date): Promise<TransitingPoint[]> {
  const se = await initSwisseph();
  const jd = toJulianDay(se, date);
  const flags = ephemerisFlag();
  const points: TransitingPoint[] = TRANSIT_PLANETS.map((planet) => {
    const arr = se.calc_ut(jd, planet.body, flags) as Float64Array;
    return {
      id: planet.id,
      longitude: normalizeLongitude(arr[0]!),
      longitudeSpeed: arr[3]!,
      retrograde: arr[3]! < 0,
    };
  });
  const northNode = points.find((point) => point.id === "northNode");
  if (northNode) {
    points.push({
      id: "southNode",
      longitude: normalizeLongitude(northNode.longitude + 180),
      longitudeSpeed: northNode.longitudeSpeed,
      retrograde: northNode.retrograde,
    });
  }
  return points;
}

export async function getActiveTransits(natalChart: NatalChartData, date: Date): Promise<ActiveTransit[]> {
  const se = await initSwisseph();
  const jd = toJulianDay(se, date);
  const flags = ephemerisFlag();
  const transits: Array<{ id: SupportedTransitPlanet; longitude: number; longitudeSpeed: number }> = TRANSIT_PLANETS.map((planet) => {
    const arr = se.calc_ut(jd, planet.body, flags) as Float64Array;
    return { id: planet.id, longitude: normalizeLongitude(arr[0]!), longitudeSpeed: arr[3]! };
  });
  const northNode = transits.find((point) => point.id === "northNode");
  if (northNode) {
    transits.push({
      id: "southNode",
      longitude: normalizeLongitude(northNode.longitude + 180),
      longitudeSpeed: northNode.longitudeSpeed,
    });
  }

  const results: ActiveTransit[] = [];
  const natalTargets: TransitTargetPoint[] = [...natalChart.points, ...buildAngleTargets(natalChart)];
  for (const transit of transits) {
    const rules = TRANSIT_RULES[transit.id];
    for (const natalPoint of natalTargets) {
      for (const aspect of rules.aspects) {
        const orb = aspectDistance(transit.longitude, natalPoint.longitude, aspect.angle);
        const maxOrb = aspect.type === "conjunction" ? rules.conjunctionOrb ?? rules.orb : rules.orb;
        if (orb <= maxOrb) {
          results.push({
            transitingPlanet: transit.id,
            natalPlanet: natalPoint.id,
            aspectType: aspect.type,
            lifecycleEvent: isAnglePointId(natalPoint.id) ? undefined : getLifecycleEvent(transit.id, natalPoint.id, aspect.type),
            orb: Math.round(orb * 100) / 100,
            exactnessDate: findExactnessDate(se, transit.id, natalPoint.longitude, aspect.angle, date),
            strength: toStrength(orb, maxOrb),
            activatedNatalAspects: isAnglePointId(natalPoint.id)
              ? []
              : natalAspectsForPoint(natalChart, natalPoint.id),
          });
        }
      }
    }
  }
  return results.sort((a, b) => a.orb - b.orb);
}
