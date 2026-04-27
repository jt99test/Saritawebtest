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
const SE_TRUE_NODE = 11, SE_MEAN_APOG = 12, SE_CHIRON = 15;
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
};

type CalcResult = ReturnType<typeof calcUt>;

type WasmHouses = {
  cusps: Float64Array;  // 1-indexed: cusps[1]=house1 … cusps[12]=house12
  ascmc: Float64Array;  // [0]=ASC [1]=MC [2]=ARMC [3]=Vertex
};

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
  eclipticLatitude = 0,
) {
  const housePosition = se.house_pos(
    houses.ascmc[2]!,  // ARMC
    latitude,
    obliquityOfDate,
    "P",
    longitude,
    eclipticLatitude,
  );
  return clampHouse(housePosition);
}

function buildPoint(
  se: SwissEph,
  config: (typeof PLANET_CONFIG)[number],
  result: CalcResult,
  houses: WasmHouses,
  latitude: number,
  obliquityOfDate: number,
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
    house: getHouseForLongitude(se, longitude, latitude, houses, obliquityOfDate, result.latitude),
    color: config.color,
    retrograde: result.longitudeSpeed < 0,
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
  retrograde = false,
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
    house: getHouseForLongitude(se, normalized, latitude, houses, obliquityOfDate),
    color,
    retrograde,
  };
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
        if (orb <= def.orb) {
          aspects.push({
            id: `${first.id}-${second.id}-${def.type}`,
            type: def.type,
            from: first.id,
            to: second.id,
            orb: Math.round(orb * 10) / 10,
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
  const julianDayUt = se.julday(
    utcDateTime.year,
    utcDateTime.month,
    utcDateTime.day,
    utcDateTime.hour + utcDateTime.minute / 60 + utcDateTime.second / 3600,
  );

  const flags = ephemerisFlag();
  const rawHouses = se.houses(julianDayUt, input.lat, input.lng, "P") as unknown as WasmHouses;

  const houseCusps: HouseCusp[] = Array.from(rawHouses.cusps.slice(1, 13)).map((longitude, index) => ({
    house: index + 1,
    longitude: normalizeLongitude(longitude),
  }));

  const eps = obliquity(julianDayUt);
  const points = PLANET_CONFIG.map((config) =>
    buildPoint(se, config, calcUt(se, julianDayUt, config.body, flags), rawHouses, input.lat, eps),
  );

  const northNode = points.find((p) => p.id === "northNode");
  const sun = points.find((p) => p.id === "sun");
  const moon = points.find((p) => p.id === "moon");

  if (northNode) {
    points.push(buildDerivedPoint(se, "southNode", "☋", northNode.longitude + 180, "#8f8798",
      rawHouses, input.lat, eps, northNode.retrograde));
  }

  if (sun && moon) {
    const isDayChart = isDiurnalSunHouse(sun.house);
    const partOfFortuneLongitude = isDayChart
      ? rawHouses.ascmc[0]! + moon.longitude - sun.longitude
      : rawHouses.ascmc[0]! + sun.longitude - moon.longitude;
    points.push(buildDerivedPoint(se, "partOfFortune", "⊗", partOfFortuneLongitude, "#f1d28f",
      rawHouses, input.lat, eps));
  }

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
      houseSystem: "placidus",
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
    },
  };
}
