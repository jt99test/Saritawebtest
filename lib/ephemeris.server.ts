import swisseph from "swisseph";
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

const PLANET_CONFIG: Array<{
  id: Exclude<ChartPointId, "southNode" | "partOfFortune">;
  body: number;
  glyph: string;
  color: string;
}> = [
  { id: "sun", body: swisseph.SE_SUN, glyph: "☉", color: "#ffcf7b" },
  { id: "moon", body: swisseph.SE_MOON, glyph: "☽", color: "#d9ddff" },
  { id: "mercury", body: swisseph.SE_MERCURY, glyph: "☿", color: "#9de6f2" },
  { id: "venus", body: swisseph.SE_VENUS, glyph: "♀", color: "#f0b7d4" },
  { id: "mars", body: swisseph.SE_MARS, glyph: "♂", color: "#ff6b86" },
  { id: "jupiter", body: swisseph.SE_JUPITER, glyph: "♃", color: "#9b90ff" },
  { id: "saturn", body: swisseph.SE_SATURN, glyph: "♄", color: "#bea3d2" },
  { id: "uranus", body: swisseph.SE_URANUS, glyph: "♅", color: "#7ce3d2" },
  { id: "neptune", body: swisseph.SE_NEPTUNE, glyph: "♆", color: "#8f98ff" },
  { id: "pluto", body: swisseph.SE_PLUTO, glyph: "♇", color: "#d768bd" },
  { id: "northNode", body: swisseph.SE_MEAN_NODE, glyph: "☊", color: "#d2d0d8" },
  { id: "chiron", body: swisseph.SE_CHIRON, glyph: "⚷", color: "#ceb39b" },
  { id: "lilith", body: swisseph.SE_MEAN_APOG, glyph: "⚸", color: "#b893d6" },
];

const ASPECT_DEFS: Array<{ type: AspectId; angle: number; orb: number }> = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 5 },
  { type: "square", angle: 90, orb: 7 },
  { type: "trine", angle: 120, orb: 7 },
  { type: "quincunx", angle: 150, orb: 3 },
  { type: "opposition", angle: 180, orb: 8 },
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

type SwissBodyData = {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
  rflag: number;
};

type SwissBodyResult = SwissBodyData | { error: string };

type SwissHousesData = {
  house: number[];
  ascendant: number;
  mc: number;
  armc: number;
  vertex: number;
  equatorialAscendant: number;
  kochCoAscendant: number;
  munkaseyCoAscendant: number;
  munkaseyPolarAscendant: number;
};

type SwissHousesResult = SwissHousesData | { error: string };

type SwissHousePositionData = {
  housePosition: number;
};

type SwissHousePositionResult = SwissHousePositionData | { error: string };

function getEphemerisFlag() {
  const ephemerisPath = process.env.SWISSEPH_EPHE_PATH;

  if (ephemerisPath) {
    swisseph.swe_set_ephe_path(ephemerisPath);
    return swisseph.SEFLG_SWIEPH;
  }

  return swisseph.SEFLG_MOSEPH;
}

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

function assertSwissResult<T extends object>(result: T | { error: string }, context: string): T {
  if ("error" in result && result.error) {
    throw new Error(`${context}: ${result.error}`);
  }

  return result as T;
}

function getHouseForLongitude(
  longitude: number,
  latitude: number,
  houses: SwissHousesData,
  obliquityOfDate: number,
  eclipticLatitude = 0,
) {
  const housePosition = assertSwissResult<SwissHousePositionData>(
    swisseph.swe_houses_pos(
      houses.armc,
      latitude,
      obliquityOfDate,
      "P",
      longitude,
      eclipticLatitude,
    ) as SwissHousePositionResult,
    "No se ha podido calcular la casa de un punto derivado",
  );

  return clampHouse(housePosition.housePosition);
}

function buildPoint(
  config: (typeof PLANET_CONFIG)[number],
  result: SwissBodyResult,
  houses: SwissHousesData,
  latitude: number,
  obliquityOfDate: number,
): ChartPoint {
  const position = assertSwissResult<SwissBodyData>(result, `No se ha podido calcular ${config.id}`);
  const longitude = normalizeLongitude(position.longitude);

  return {
    id: config.id,
    glyph: config.glyph,
    longitude,
    sign: getSignFromLongitude(longitude),
    degreeLabel: toZodiacDegreeLabel(longitude),
    degreeInSign: getDegreeInSign(longitude),
    minutesInSign: getMinutesInSign(longitude),
    absoluteLongitudeLabel: toAbsoluteLongitudeLabel(longitude),
    house: getHouseForLongitude(longitude, latitude, houses, obliquityOfDate, position.latitude),
    color: config.color,
    retrograde: position.longitudeSpeed < 0,
  };
}

function buildDerivedPoint(
  id: ChartPointId,
  glyph: string,
  longitude: number,
  color: string,
  houses: SwissHousesData,
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
    house: getHouseForLongitude(normalized, latitude, houses, obliquityOfDate),
    color,
    retrograde,
  };
}

function detectAspects(points: ChartPoint[]): Aspect[] {
  const drawablePointIds = new Set<ChartPointId>([
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
    "chiron",
    "partOfFortune",
    "lilith",
  ]);

  const aspects: Aspect[] = [];

  for (let index = 0; index < points.length; index += 1) {
    for (let innerIndex = index + 1; innerIndex < points.length; innerIndex += 1) {
      const first = points[index]!;
      const second = points[innerIndex]!;

      if (!drawablePointIds.has(first.id) || !drawablePointIds.has(second.id)) {
        continue;
      }

      const angle = circularDistance(first.longitude, second.longitude);

      for (const definition of ASPECT_DEFS) {
        const orb = Math.abs(angle - definition.angle);

        if (orb <= definition.orb) {
          aspects.push({
            id: `${first.id}-${second.id}-${definition.type}`,
            type: definition.type,
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
  const localDateTime = DateTime.fromISO(`${input.birthDate}T${input.birthTime}:00`, {
    zone: input.timezone,
  });

  if (!localDateTime.isValid) {
    throw new Error("Fecha, hora o zona horaria no válidas");
  }

  const utcDateTime = localDateTime.toUTC();
  const julianDayUt = swisseph.swe_julday(
    utcDateTime.year,
    utcDateTime.month,
    utcDateTime.day,
    utcDateTime.hour + utcDateTime.minute / 60 + utcDateTime.second / 3600,
    swisseph.SE_GREG_CAL,
  );

  const flags = swisseph.SEFLG_SPEED | getEphemerisFlag();
  const houses = assertSwissResult<SwissHousesData>(
    swisseph.swe_houses(julianDayUt, input.lat, input.lng, "P") as SwissHousesResult,
    "No se han podido calcular las casas",
  );

  const houseCusps: HouseCusp[] = houses.house.slice(0, 12).map((longitude, index) => ({
    house: index + 1,
    longitude: normalizeLongitude(longitude),
  }));

  const eps = obliquity(julianDayUt);
  const points = PLANET_CONFIG.map((config) =>
    buildPoint(
      config,
      swisseph.swe_calc_ut(julianDayUt, config.body, flags) as SwissBodyResult,
      houses,
      input.lat,
      eps,
    ),
  );

  const northNode = points.find((point) => point.id === "northNode");
  const sun = points.find((point) => point.id === "sun");
  const moon = points.find((point) => point.id === "moon");

  if (northNode) {
    points.push(
      buildDerivedPoint(
        "southNode",
        "☋",
        northNode.longitude + 180,
        "#8f8798",
        houses,
        input.lat,
        eps,
        northNode.retrograde,
      ),
    );
  }

  if (sun && moon) {
    const isDayChart = isDiurnalSunHouse(sun.house);
    const partOfFortuneLongitude = isDayChart
      ? houses.ascendant + moon.longitude - sun.longitude
      : houses.ascendant + sun.longitude - moon.longitude;

    points.push(
      buildDerivedPoint(
        "partOfFortune",
        "⊗",
        partOfFortuneLongitude,
        "#f1d28f",
        houses,
        input.lat,
        eps,
      ),
    );
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
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
      ascendant: normalizeLongitude(houses.ascendant),
      mc: normalizeLongitude(houses.mc),
      descendant: normalizeLongitude(houses.house[6] ?? houses.ascendant + 180),
      ic: normalizeLongitude(houses.house[3] ?? houses.mc + 180),
    },
  };
}
