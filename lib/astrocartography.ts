import { normalizeLongitude, type ChartPoint, type ChartPointId, type NatalChartData } from "@/lib/chart";

export type AstrocartographyAngle = "AC" | "DC" | "MC" | "IC";

export type AstrocartographyLine = {
  id: string;
  planetId: ChartPointId;
  planetGlyph: string;
  planetLabel: string;
  angle: AstrocartographyAngle;
  color: string;
  points: Array<{ lat: number; lng: number }>;
};

export type AstrocartographyNearbyLine = {
  lineId: string;
  planetId: ChartPointId;
  planetLabel: string;
  angle: AstrocartographyAngle;
  distanceKm: number;
  influence: "strong" | "noticeable" | "background";
  color: string;
};

const EARTH_RADIUS_KM = 6371;
const OBLIQUITY_DEG = 23.4392911;
const NATAL_PLANETS: ChartPointId[] = [
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
];

const POINT_LABELS: Partial<Record<ChartPointId, string>> = {
  sun: "Sol",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "Jupiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "Pluton",
};

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function normalizeSignedLongitude(lng: number) {
  const normalized = ((lng + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

function angularDistanceDegrees(a: number, b: number) {
  const diff = Math.abs(normalizeSignedLongitude(a - b));
  return Math.min(diff, 360 - diff);
}

function julianDayFromChart(chart: NatalChartData) {
  const parsed = chart.event.julianDay ? Number(chart.event.julianDay) : NaN;
  return Number.isFinite(parsed) ? parsed : 2451545;
}

function greenwichSiderealTime(julianDay: number) {
  const t = (julianDay - 2451545.0) / 36525;
  return normalizeLongitude(
    280.46061837 +
      360.98564736629 * (julianDay - 2451545.0) +
      0.000387933 * t * t -
      (t * t * t) / 38710000,
  );
}

function eclipticToEquatorial(longitude: number) {
  const lambda = degToRad(normalizeLongitude(longitude));
  const epsilon = degToRad(OBLIQUITY_DEG);
  const rightAscension = normalizeLongitude(radToDeg(Math.atan2(Math.sin(lambda) * Math.cos(epsilon), Math.cos(lambda))));
  const declination = radToDeg(Math.asin(Math.sin(lambda) * Math.sin(epsilon)));

  return { rightAscension, declination };
}

function longitudeForLst(lst: number, greenwichSidereal: number) {
  return normalizeSignedLongitude(lst - greenwichSidereal);
}

function splitDateline(points: Array<{ lat: number; lng: number }>) {
  const segments: Array<Array<{ lat: number; lng: number }>> = [];
  let current: Array<{ lat: number; lng: number }> = [];

  points.forEach((point) => {
    const previous = current[current.length - 1];
    if (previous && Math.abs(point.lng - previous.lng) > 180) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push(point);
  });

  if (current.length > 1) segments.push(current);
  return segments;
}

function angularLinePoints(rightAscension: number, declination: number, greenwichSidereal: number, angle: AstrocartographyAngle) {
  // This isolates the current ACG approximation: MC/IC are sidereal meridians,
  // while AC/DC solve the horizon crossing from natal ecliptic longitude
  // converted to right ascension/declination. It avoids a new astronomy
  // dependency and can be swapped later for a higher-precision engine.
  if (angle === "MC" || angle === "IC") {
    const lng = longitudeForLst(rightAscension + (angle === "IC" ? 180 : 0), greenwichSidereal);
    return [{ lat: -82, lng }, { lat: 82, lng }];
  }

  const points: Array<{ lat: number; lng: number }> = [];
  for (let lat = -66; lat <= 66; lat += 2) {
    const latRad = degToRad(lat);
    const decRad = degToRad(declination);
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    if (cosHourAngle < -1 || cosHourAngle > 1) {
      continue;
    }

    const hourAngle = radToDeg(Math.acos(cosHourAngle));
    const lst = angle === "AC" ? rightAscension - hourAngle : rightAscension + hourAngle;
    points.push({ lat, lng: longitudeForLst(lst, greenwichSidereal) });
  }

  return points;
}

export function calculateAstrocartographyLines(chart: NatalChartData): AstrocartographyLine[] {
  const greenwichSidereal = greenwichSiderealTime(julianDayFromChart(chart));

  return chart.points
    .filter((point) => NATAL_PLANETS.includes(point.id))
    .flatMap((point) => {
      const { rightAscension, declination } = eclipticToEquatorial(point.longitude);

      return (["AC", "DC", "MC", "IC"] as const).map((angle) => ({
        id: `${point.id}-${angle}`,
        planetId: point.id,
        planetGlyph: point.glyph,
        planetLabel: POINT_LABELS[point.id] ?? point.id,
        angle,
        color: point.color,
        points: angularLinePoints(rightAscension, declination, greenwichSidereal, angle),
      }));
    })
    .filter((line) => line.points.length > 1);
}

export function astrocartographySegments(line: AstrocartographyLine) {
  return splitDateline(line.points);
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = degToRad(b.lat - a.lat);
  const dLng = degToRad(b.lng - a.lng);
  const lat1 = degToRad(a.lat);
  const lat2 = degToRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function closestSampleDistanceKm(location: { lat: number; lng: number }, line: AstrocartographyLine) {
  if (line.angle === "MC" || line.angle === "IC") {
    return angularDistanceDegrees(location.lng, line.points[0]?.lng ?? 0) * 111.32 * Math.cos(degToRad(location.lat));
  }

  return line.points.reduce((closest, point) => Math.min(closest, haversineKm(location, point)), Number.POSITIVE_INFINITY);
}

export function findNearbyAstrocartographyLines(
  lines: AstrocartographyLine[],
  location: { lat: number; lng: number },
  limit = 6,
): AstrocartographyNearbyLine[] {
  return lines
    .map((line) => {
      const distanceKm = Math.max(0, Math.round(closestSampleDistanceKm(location, line)));
      return {
        lineId: line.id,
        planetId: line.planetId,
        planetLabel: line.planetLabel,
        angle: line.angle,
        distanceKm,
        influence: distanceKm <= 250 ? "strong" as const : distanceKm <= 700 ? "noticeable" as const : "background" as const,
        color: line.color,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function astrocartographyCacheKey(chart: NatalChartData) {
  const planetSeed = chart.points
    .filter((point): point is ChartPoint => NATAL_PLANETS.includes(point.id))
    .map((point) => `${point.id}:${point.longitude.toFixed(4)}`)
    .join("|");

  return `acg-lines:v1:${chart.event.julianDay ?? chart.event.dateLabel}:${planetSeed}`;
}
