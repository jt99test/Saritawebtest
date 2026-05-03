import SwissEph from "swisseph-wasm";
import { DateTime } from "luxon";

import type {
  Aspect,
  AspectId,
  ChartPoint,
  ChartPointId,
  HouseCusp,
  NatalChartData,
} from "./chart";
import {
  getDegreeInSign,
  getMinutesInSign,
  getSignFromLongitude,
  normalizeLongitude,
  toAbsoluteLongitudeLabel,
  toZodiacDegreeLabel,
} from "./chart";

// Stable SE numeric constants (never change across SE versions)
const SE_SUN = 0, SE_MOON = 1, SE_MERCURY = 2, SE_VENUS = 3, SE_MARS = 4;
const SE_JUPITER = 5, SE_SATURN = 6, SE_URANUS = 7, SE_NEPTUNE = 8, SE_PLUTO = 9;
const SE_TRUE_NODE = 11, SE_MEAN_APOG = 12, SE_CHIRON = 15, SE_CERES = 17;
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

// calc_ut = Universal Time (matches original swe_calc_ut); calc() uses TT — wrong for our JD
function calcUt(se: SwissEph, jd: number, body: number, flags: number) {
  const arr = se.calc_ut(jd, body, flags) as Float64Array;
  return {
    longitude:      arr[0]!,
    latitude:       arr[1]!,
    distance:       arr[2]!,
    longitudeSpeed: arr[3]!,
    latitudeSpeed:  arr[4]!,
    distanceSpeed:  arr[5]!,
  };
}

const PLANET_CONFIG: Array<{
  id: Exclude<ChartPointId, "southNode" | "partOfFortune">;
  body: number;
  glyph: string;
  color: string;
}> = [
  { id: "sun",       body: SE_SUN,       glyph: "☉", color: "#ffcf7b" },
  { id: "moon",      body: SE_MOON,      glyph: "☽", color: "#d9ddff" },
  { id: "mercury",   body: SE_MERCURY,   glyph: "☿", color: "#9de6f2" },
  { id: "venus",     body: SE_VENUS,     glyph: "♀", color: "#f0b7d4" },
  { id: "mars",      body: SE_MARS,      glyph: "♂", color: "#ff6b86" },
  { id: "jupiter",   body: SE_JUPITER,   glyph: "♃", color: "#9b90ff" },
  { id: "saturn",    body: SE_SATURN,    glyph: "♄", color: "#bea3d2" },
  { id: "uranus",    body: SE_URANUS,    glyph: "♅", color: "#7ce3d2" },
  { id: "neptune",   body: SE_NEPTUNE,   glyph: "♆", color: "#8f98ff" },
  { id: "pluto",     body: SE_PLUTO,     glyph: "♇", color: "#d768bd" },
  { id: "northNode", body: SE_TRUE_NODE, glyph: "☊", color: "#d2d0d8" },
  { id: "chiron",    body: SE_CHIRON,    glyph: "⚷", color: "#ceb39b" },
  { id: "lilith",    body: SE_MEAN_APOG, glyph: "⚸", color: "#b893d6" },
];

const ASPECT_DEFS: Array<{ type: AspectId; angle: number; orb: number }> = [
  { type: "conjunction", angle: 0,   orb: 8 },
  { type: "sextile",     angle: 60,  orb: 5 },
  { type: "square",      angle: 90,  orb: 7 },
  { type: "trine",       angle: 120, orb: 7 },
  { type: "quincunx",    angle: 150, orb: 3 },
  { type: "opposition",  angle: 180, orb: 8 },
];

type ChartInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  timezone: string;
  displayLocation: string;
  lat: number;
  lng: number;
  daylightSaving: boolean;
  houseSystem?: "P" | "W" | "K" | "E";
  julianDayUt?: number;
  solarReturnYear?: number;
};

type CalcResult = ReturnType<typeof calcUt>;

type WasmHouses = {
  cusps: Float64Array;  // 1-indexed: cusps[1]=house1 … cusps[12]=house12
  ascmc: Float64Array;  // [0]=ASC [1]=MC [2]=ARMC [3]=Vertex
};

const FIVE_DEGREE_CUSP_ORB = 5;
const FIVE_DEGREE_CUSP_POINT_IDS = new Set<ChartPointId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
  "southNode",
]);

const HOUSE_SYSTEM_LABELS = {
  P: "placidus",
  W: "wholeSign",
  K: "koch",
  E: "equal",
} as const;

function obliquity(julianDayUt: number) {
  const t = (julianDayUt - 2451545.0) / 36525;
  return 23.439291111 - 0.013004167 * t - 0.0000001638 * t * t + 0.0000005036 * t * t * t;
}

function formatCoord(value: number, isLat: boolean): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minDec = (abs - degrees) * 60;
  const minutes = Math.floor(minDec);
  const seconds = Math.round((minDec - minutes) * 60);
  const direction = isLat ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${degrees}° ${minutes}′ ${seconds}″ ${direction}`;
}

function clampHouse(housePosition: number) {
  const wrapped = ((housePosition - 1 + 12) % 12) + 1;
  return Math.max(1, Math.min(12, Math.floor(wrapped)));
}

function circularDistance(first: number, second: number) {
  const difference = Math.abs(first - second);
  return difference > 180 ? 360 - difference : difference;
}

function getHouseForLongitude(
  se: SwissEph,
  longitude: number,
  latitude: number,
  houses: WasmHouses,
  obliquityOfDate: number,
  houseSystem: ChartInput["houseSystem"] = "P",
  applyFiveDegreeCuspRule = false,
) {
  // Match standard chart-wheel practice and Astro.com style placement:
  // house membership is read from ecliptic longitude on the zodiac circle,
  // not from the body's ecliptic latitude / mundane position.
  const housePosition = se.house_pos(
    houses.ascmc[2]!,  // ARMC
    latitude,
    obliquityOfDate,
    houseSystem,
    longitude,
    0,
  );
  const house = clampHouse(housePosition);

  if (!applyFiveDegreeCuspRule) {
    return house;
  }

  const nextHouse = house === 12 ? 1 : house + 1;
  const nextCusp = normalizeLongitude(houses.cusps[nextHouse]!);
  const distanceBeforeNextCusp = normalizeLongitude(nextCusp - longitude);

  // Traditional practice commonly uses a 5 degree orb before a cusp, though some schools use 3.
  // SARITA applies the 5 degree rule for planets and nodes, not for cusp/angle points.
  return distanceBeforeNextCusp < FIVE_DEGREE_CUSP_ORB ? nextHouse : house;
}

function buildPoint(
  se: SwissEph,
  config: (typeof PLANET_CONFIG)[number],
  result: CalcResult,
  houses: WasmHouses,
  latitude: number,
  obliquityOfDate: number,
  houseSystem: ChartInput["houseSystem"],
): ChartPoint {
  const longitude = normalizeLongitude(result.longitude);
  return {
    id: config.id,
    glyph: config.glyph,
    longitude,
    sign: getSignFromLongitude(longitude),
    degreeLabel: toZodiacDegreeLabel(longitude),
    degreeInSign: getDegreeInSign(longitude),
    minutesInSign: getMinutesInSign(longitude),
    absoluteLongitudeLabel: toAbsoluteLongitudeLabel(longitude),
    house: getHouseForLongitude(
      se,
      longitude,
      latitude,
      houses,
      obliquityOfDate,
      houseSystem,
      FIVE_DEGREE_CUSP_POINT_IDS.has(config.id),
    ),
    color: config.color,
    retrograde: result.longitudeSpeed < 0,
    longitudeSpeed: result.longitudeSpeed,
  };
}

function buildDerivedPoint(
  se: SwissEph,
  id: ChartPointId,
  glyph: string,
  longitude: number,
  color: string,
  houses: WasmHouses,
  latitude: number,
  obliquityOfDate: number,
  houseSystem: ChartInput["houseSystem"],
  retrograde = false,
  applyFiveDegreeCuspRule = false,
  longitudeSpeed = 0,
): ChartPoint {
  const normalized = normalizeLongitude(longitude);
  return {
    id,
    glyph,
    longitude: normalized,
    sign: getSignFromLongitude(normalized),
    degreeLabel: toZodiacDegreeLabel(normalized),
    degreeInSign: getDegreeInSign(normalized),
    minutesInSign: getMinutesInSign(normalized),
    absoluteLongitudeLabel: toAbsoluteLongitudeLabel(normalized),
    house: getHouseForLongitude(
      se,
      normalized,
      latitude,
      houses,
      obliquityOfDate,
      houseSystem,
      applyFiveDegreeCuspRule,
    ),
    color,
    retrograde,
    longitudeSpeed,
  };
}

function aspectOrb(def: (typeof ASPECT_DEFS)[number], first: ChartPoint, second: ChartPoint) {
  const hasLuminary = first.id === "sun" || first.id === "moon" || second.id === "sun" || second.id === "moon";
  if (!hasLuminary) return def.orb;
  if (def.type === "conjunction" || def.type === "opposition") return 10;
  if (def.type === "square" || def.type === "trine") return 9;
  if (def.type === "sextile") return 6;
  return def.orb;
}

function aspectDelta(firstLongitude: number, secondLongitude: number, targetAngle: number) {
  return Math.abs(circularDistance(firstLongitude, secondLongitude) - targetAngle);
}

function isApplying(first: ChartPoint, second: ChartPoint, targetAngle: number, currentOrb: number) {
  const futureFirst = normalizeLongitude(first.longitude + (first.longitudeSpeed ?? 0));
  const futureSecond = normalizeLongitude(second.longitude + (second.longitudeSpeed ?? 0));
  return aspectDelta(futureFirst, futureSecond, targetAngle) < currentOrb;
}

function detectAspects(points: ChartPoint[]): Aspect[] {
  const drawablePointIds = new Set<ChartPointId>([
    "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto", "northNode", "southNode", "chiron",
    "partOfFortune", "lilith",
  ]);

  const aspects: Aspect[] = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const first = points[i]!;
      const second = points[j]!;
      if (!drawablePointIds.has(first.id) || !drawablePointIds.has(second.id)) continue;

      const angle = circularDistance(first.longitude, second.longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(angle - def.angle);
        if (orb <= aspectOrb(def, first, second)) {
          aspects.push({
            id: `${first.id}-${second.id}-${def.type}`,
            type: def.type,
            from: first.id,
            to: second.id,
            orb: Math.round(orb * 10) / 10,
            applying: isApplying(first, second, def.angle, orb),
          });
          break;
        }
      }
    }
  }
  return aspects;
}

function isDiurnalSunHouse(house: number) {
  return house >= 7 && house <= 12;
}

export async function calculateNatalChart(input: ChartInput): Promise<NatalChartData> {
  const se = await initSwisseph();

  const localDateTime = DateTime.fromISO(`${input.birthDate}T${input.birthTime}:00`, {
    zone: input.timezone,
  });

  if (!localDateTime.isValid) {
    throw new Error("Fecha, hora o zona horaria no válidas");
  }

  const utcDateTime = localDateTime.toUTC();
  const julianDayUt = input.julianDayUt ?? se.julday(
    utcDateTime.year,
    utcDateTime.month,
    utcDateTime.day,
    utcDateTime.hour + utcDateTime.minute / 60 + utcDateTime.second / 3600,
  );

  const flags = ephemerisFlag();
  const houseSystem = input.houseSystem ?? "P";
  const rawHouses = se.houses(julianDayUt, input.lat, input.lng, houseSystem) as unknown as WasmHouses;

  const houseCusps: HouseCusp[] = Array.from(rawHouses.cusps.slice(1, 13)).map((longitude, index) => ({
    house: index + 1,
    longitude: normalizeLongitude(longitude),
  }));

  const eps = obliquity(julianDayUt);
  const points = PLANET_CONFIG.map((config) =>
    buildPoint(se, config, calcUt(se, julianDayUt, config.body, flags), rawHouses, input.lat, eps, houseSystem),
  );

  const northNode = points.find((p) => p.id === "northNode");
  const sun = points.find((p) => p.id === "sun");
  const moon = points.find((p) => p.id === "moon");

  if (northNode) {
    points.push(buildDerivedPoint(se, "southNode", "☋", northNode.longitude + 180, "#8f8798",
      rawHouses, input.lat, eps, houseSystem, northNode.retrograde, true, northNode.longitudeSpeed ?? 0));
  }

  if (sun && moon) {
    const isDayChart = isDiurnalSunHouse(sun.house);
    const partOfFortuneLongitude = isDayChart
      ? rawHouses.ascmc[0]! + moon.longitude - sun.longitude
      : rawHouses.ascmc[0]! + sun.longitude - moon.longitude;
    points.push(buildDerivedPoint(se, "partOfFortune", "⊗", partOfFortuneLongitude, "#f1d28f",
      rawHouses, input.lat, eps, houseSystem));
  }

  // Ceres is optional in SARITA's extended data layer; it stays out of core points
  // until a view explicitly chooses to render extended points.
  const ceresResult = calcUt(se, julianDayUt, SE_CERES, flags);
  const ceres = buildDerivedPoint(se, "ceres", "⚳", ceresResult.longitude, "#cdbf8d",
    rawHouses, input.lat, eps, houseSystem, ceresResult.longitudeSpeed < 0, false, ceresResult.longitudeSpeed);
  const extendedPoints = [...points, ceres];

  const aspects = detectAspects(points);
  const offsetMinutes = localDateTime.offset;
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetRemainder = Math.abs(offsetMinutes) % 60;
  const utcOffset = `UTC${offsetMinutes >= 0 ? "+" : "-"}${String(offsetHours).padStart(2, "0")}:${String(offsetRemainder).padStart(2, "0")}`;

  return {
    event: {
      name: input.name,
      title: `Carta natal de ${input.name}`,
      dateLabel: localDateTime.setLocale("es").toLocaleString({
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      locationLabel: input.displayLocation,
      latitude: formatCoord(input.lat, true),
      longitude: formatCoord(input.lng, false),
      utcOffset,
      timezone: localDateTime.offsetNameShort ?? "",
      daylightSaving: input.daylightSaving ? "Sí" : "No",
      timezoneIdentifier: input.timezone,
      julianDay: julianDayUt.toFixed(6),
    },
    settings: {
      zodiac: "tropical",
      houseSystem: HOUSE_SYSTEM_LABELS[houseSystem],
      locus: "geocentric",
      chartMethod: "natal",
      calculationMethod: "swissEphemeris",
    },
    points,
    houses: houseCusps,
    aspects,
    meta: {
      ascendant:  normalizeLongitude(rawHouses.ascmc[0]!),
      mc:         normalizeLongitude(rawHouses.ascmc[1]!),
      descendant: normalizeLongitude(rawHouses.cusps[7]  ?? rawHouses.ascmc[0]! + 180),
      ic:         normalizeLongitude(rawHouses.cusps[4]  ?? rawHouses.ascmc[1]! + 180),
      solarReturnYear: input.solarReturnYear,
    },
    extendedPoints,
  };
}

function longitudeDelta(current: number, target: number) {
  const delta = normalizeLongitude(current - target);
  return delta > 180 ? delta - 360 : delta;
}

export async function calculateSolarReturn(
  natalSunLongitude: number,
  targetYear: number,
  lat: number,
  lng: number,
  birthMonth = 6,
  birthDay = 30,
): Promise<NatalChartData> {
  if (targetYear < 1901 || targetYear > 2100) {
    throw new Error("Año de revolución solar fuera de rango");
  }

  const se = await initSwisseph();
  const flags = ephemerisFlag();
  const estimate = DateTime.utc(targetYear, birthMonth, birthDay, 12);
  const estimateJd = se.julday(
    estimate.year,
    estimate.month,
    estimate.day,
    estimate.hour,
  );
  let low = estimateJd - 2;
  let high = estimateJd + 2;

  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const delta = longitudeDelta(calcUt(se, mid, SE_SUN, flags).longitude, natalSunLongitude);

    if (Math.abs(delta) < 0.0003) {
      low = mid;
      high = mid;
      break;
    }

    if (delta > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const julianDayUt = (low + high) / 2;
  const returnDate = estimate.plus({ days: julianDayUt - estimateJd });

  return calculateNatalChart({
    name: `RS ${targetYear}`,
    birthDate: returnDate.toISODate() ?? `${targetYear}-01-01`,
    birthTime: returnDate.toFormat("HH:mm"),
    timezone: "UTC",
    displayLocation: "Revolución Solar",
    lat,
    lng,
    daylightSaving: false,
    julianDayUt,
    solarReturnYear: targetYear,
  });
}
