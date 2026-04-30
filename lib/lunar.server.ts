import SwissEph from "swisseph-wasm";
import { DateTime } from "luxon";

import type { HouseCusp, NatalChartData, SignId } from "@/lib/chart";
import { distanceToNodeAxis } from "@/lib/chart-insights";
import {
  getDegreeInSign,
  getMinutesInSign,
  getSignFromLongitude,
  normalizeLongitude,
  zodiacSigns,
} from "@/lib/chart";

const SE_SUN = 0, SE_MOON = 1, SE_TRUE_NODE = 11;
const SEFLG_SPEED = 256, SEFLG_SWIEPH = 2;

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

export type ElementRoutineId = "fuego" | "tierra" | "agua" | "aire";

export type LunationPoint = {
  timestamp: string;
  longitude: number;
  sign: SignId;
  degreeInSign: number;
  minutesInSign: number;
};

export type MonthlyLunarActivation = {
  timestamp: string;
  position: { sign: SignId; degree: number; minutes: number; longitude: number };
  activatedHouse: number;
  element: "fire" | "earth" | "air" | "water";
  assignedRoutine: ElementRoutineId;
  eclipse?: {
    isEclipse: boolean;
    kind: "solar" | "lunar";
    nodeOrb: number;
  };
};

export type MonthlyLunarData = {
  lunaNueva: MonthlyLunarActivation | null;
  lunaNuevaSecondary?: MonthlyLunarActivation | null;
  lunaLlena: MonthlyLunarActivation | null;
  lunaLlenaSecondary?: MonthlyLunarActivation | null;
};

type LunationKind = "nueva" | "llena";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function toJulianDay(se: SwissEph, date: Date): number {
  const dt = DateTime.fromJSDate(date, { zone: "utc" });
  return se.julday(
    dt.year, dt.month, dt.day,
    dt.hour + dt.minute / 60 + dt.second / 3600 + dt.millisecond / 3600000,
  );
}

function getSunMoonLongitudes(se: SwissEph, date: Date) {
  const jd = toJulianDay(se, date);
  const flags = ephemerisFlag();
  const sunArr  = se.calc_ut(jd, SE_SUN,  flags) as Float64Array;
  const moonArr = se.calc_ut(jd, SE_MOON, flags) as Float64Array;
  return {
    sunLongitude:  normalizeLongitude(sunArr[0]!),
    moonLongitude: normalizeLongitude(moonArr[0]!),
  };
}

function getAngularDifference(se: SwissEph, date: Date, type: LunationKind) {
  const { sunLongitude, moonLongitude } = getSunMoonLongitudes(se, date);
  const target = type === "nueva" ? 0 : 180;
  const moonMinusSun = normalizeLongitude(moonLongitude - sunLongitude);
  const rawDistance = normalizeLongitude(moonMinusSun - target);
  const signedDistance = rawDistance > 180 ? rawDistance - 360 : rawDistance;
  return { signedDistance, absoluteDistance: Math.abs(signedDistance), moonLongitude };
}

function refineLunation(se: SwissEph, startMs: number, endMs: number, type: LunationKind) {
  let left = startMs;
  let right = endMs;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const leftThird = left + (right - left) / 3;
    const rightThird = right - (right - left) / 3;
    const leftDistance = getAngularDifference(se, new Date(leftThird), type).absoluteDistance;
    const rightDistance = getAngularDifference(se, new Date(rightThird), type).absoluteDistance;

    if (Math.abs(leftDistance - rightDistance) < 0.00001 || right - left < 1000) {
      left = leftThird; right = rightThird; break;
    }
    if (leftDistance <= rightDistance) { right = rightThird; } else { left = leftThird; }
  }

  const exactMs = (left + right) / 2;
  const exactDate = new Date(exactMs);
  const { moonLongitude } = getAngularDifference(se, exactDate, type);
  const longitude = normalizeLongitude(moonLongitude);

  return {
    timestamp: DateTime.fromJSDate(exactDate, { zone: "utc" }).toISO({
      suppressMilliseconds: true, includeOffset: false,
    }) + "Z",
    longitude,
    sign: getSignFromLongitude(longitude),
    degreeInSign: getDegreeInSign(longitude),
    minutesInSign: getMinutesInSign(longitude),
  } satisfies LunationPoint;
}

function getLunationsForMonth(se: SwissEph, year: number, month: number, type: LunationKind) {
  const monthStart = DateTime.utc(year, month, 1).startOf("day");
  const monthEnd = monthStart.plus({ months: 1 }).minus({ seconds: 1 });
  const samples: Array<{ timestampMs: number; absoluteDistance: number }> = [];
  const matches: LunationPoint[] = [];

  for (let timestampMs = monthStart.toMillis(); timestampMs <= monthEnd.toMillis(); timestampMs += SIX_HOURS_MS) {
    samples.push({ timestampMs, absoluteDistance: getAngularDifference(se, new Date(timestampMs), type).absoluteDistance });
  }

  for (let index = 1; index < samples.length - 1; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    const next = samples[index + 1]!;
    const isLocalMinimum =
      current.absoluteDistance <= previous.absoluteDistance &&
      current.absoluteDistance <= next.absoluteDistance &&
      current.absoluteDistance < 15;
    if (!isLocalMinimum) continue;

    const refined = refineLunation(se, previous.timestampMs, next.timestampMs, type);
    const alreadyTracked = matches.some((entry) => {
      const a = DateTime.fromISO(entry.timestamp, { zone: "utc" }).toMillis();
      const b = DateTime.fromISO(refined.timestamp, { zone: "utc" }).toMillis();
      return Math.abs(a - b) < 2 * 60 * 60 * 1000;
    });
    if (!alreadyTracked) matches.push(refined);
  }

  return matches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function getEclipseInfo(se: SwissEph, point: LunationPoint, type: LunationKind) {
  const jd = toJulianDay(se, new Date(point.timestamp));
  const nodeArr = se.calc_ut(jd, SE_TRUE_NODE, ephemerisFlag()) as Float64Array;
  const nodeOrb = distanceToNodeAxis(point.longitude, normalizeLongitude(nodeArr[0]!));
  return {
    isEclipse: nodeOrb <= 18,
    kind: type === "nueva" ? "solar" as const : "lunar" as const,
    nodeOrb: Math.round(nodeOrb * 10) / 10,
  };
}

function toActivation(se: SwissEph, point: LunationPoint, natalHouses: HouseCusp[], type: LunationKind): MonthlyLunarActivation {
  const element = getElementForSign(point.sign);
  const eclipse = getEclipseInfo(se, point, type);
  return {
    timestamp: point.timestamp,
    position: { sign: point.sign, degree: point.degreeInSign, minutes: point.minutesInSign, longitude: point.longitude },
    activatedHouse: getActivatedHouse(point.longitude, natalHouses),
    element,
    assignedRoutine: getRoutineForElement(element),
    eclipse: eclipse.isEclipse ? eclipse : undefined,
  };
}

export function getActivatedHouse(lunationLongitude: number, natalHouses: HouseCusp[]): number {
  const longitude = normalizeLongitude(lunationLongitude);
  for (let index = 0; index < natalHouses.length; index += 1) {
    const current = natalHouses[index]!;
    const next = natalHouses[(index + 1) % natalHouses.length]!;
    const start = normalizeLongitude(current.longitude);
    const end = normalizeLongitude(next.longitude);
    const inHouse = start <= end ? longitude >= start && longitude < end : longitude >= start || longitude < end;
    if (inHouse) return current.house;
  }
  return natalHouses[natalHouses.length - 1]?.house ?? 12;
}

export function getElementForSign(signId: SignId): "fire" | "earth" | "air" | "water" {
  const sign = zodiacSigns.find((entry) => entry.id === signId);
  if (!sign) throw new Error(`No se encontró el signo ${signId}`);
  return sign.element;
}

export function getRoutineForElement(element: string): ElementRoutineId {
  switch (element) {
    case "fire":  return "fuego";
    case "earth": return "tierra";
    case "water": return "agua";
    case "air":   return "aire";
    default: throw new Error(`Elemento no soportado para rutina: ${element}`);
  }
}

export async function getLunaNuevaForMonth(year: number, month: number): Promise<LunationPoint | null> {
  const se = await initSwisseph();
  return getLunationsForMonth(se, year, month, "nueva")[0] ?? null;
}

export async function getLunaLlenaForMonth(year: number, month: number): Promise<LunationPoint | null> {
  const se = await initSwisseph();
  return getLunationsForMonth(se, year, month, "llena")[0] ?? null;
}

export async function getMonthlyLunarData(
  natalChart: NatalChartData,
  year: number,
  month: number,
): Promise<MonthlyLunarData> {
  const se = await initSwisseph();
  const lunasNuevas = getLunationsForMonth(se, year, month, "nueva");
  const lunasLlenas = getLunationsForMonth(se, year, month, "llena");
  return {
    lunaNueva:          lunasNuevas[0] ? toActivation(se, lunasNuevas[0], natalChart.houses, "nueva") : null,
    lunaNuevaSecondary: lunasNuevas[1] ? toActivation(se, lunasNuevas[1], natalChart.houses, "nueva") : null,
    lunaLlena:          lunasLlenas[0] ? toActivation(se, lunasLlenas[0], natalChart.houses, "llena") : null,
    lunaLlenaSecondary: lunasLlenas[1] ? toActivation(se, lunasLlenas[1], natalChart.houses, "llena") : null,
  };
}
