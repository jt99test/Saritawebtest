export const zodiacSigns = [
  { id: "aries", glyph: "♈", start: 0, element: "fire", modality: "cardinal", color: "rgba(210,95,105,0.82)" },
  { id: "taurus", glyph: "♉", start: 30, element: "earth", modality: "fixed", color: "rgba(175,150,175,0.70)" },
  { id: "gemini", glyph: "♊", start: 60, element: "air", modality: "mutable", color: "rgba(78,188,205,0.75)" },
  { id: "cancer", glyph: "♋", start: 90, element: "water", modality: "cardinal", color: "rgba(105,88,198,0.75)" },
  { id: "leo", glyph: "♌", start: 120, element: "fire", modality: "fixed", color: "rgba(210,95,105,0.82)" },
  { id: "virgo", glyph: "♍", start: 150, element: "earth", modality: "mutable", color: "rgba(175,150,175,0.70)" },
  { id: "libra", glyph: "♎", start: 180, element: "air", modality: "cardinal", color: "rgba(78,188,205,0.75)" },
  { id: "scorpio", glyph: "♏", start: 210, element: "water", modality: "fixed", color: "rgba(105,88,198,0.75)" },
  { id: "sagittarius", glyph: "♐", start: 240, element: "fire", modality: "mutable", color: "rgba(210,95,105,0.82)" },
  { id: "capricorn", glyph: "♑", start: 270, element: "earth", modality: "cardinal", color: "rgba(175,150,175,0.70)" },
  { id: "aquarius", glyph: "♒", start: 300, element: "air", modality: "fixed", color: "rgba(78,188,205,0.75)" },
  { id: "pisces", glyph: "♓", start: 330, element: "water", modality: "mutable", color: "rgba(105,88,198,0.75)" },
] as const;

export type SignId = (typeof zodiacSigns)[number]["id"];
export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";
export type ChartMethod = "natal";
export type CalculationMethod = "swissEphemeris";

export type ChartPointId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "northNode"
  | "southNode"
  | "chiron"
  | "partOfFortune"
  | "lilith"
  | "ceres";

export type AspectId =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "quincunx";

export type ChartSettings = {
  zodiac: "tropical";
  houseSystem: "placidus" | "wholeSign" | "koch" | "equal";
  locus: "geocentric";
  chartMethod: ChartMethod;
  calculationMethod: CalculationMethod;
};

export type ChartEventMeta = {
  name: string;
  title: string;
  dateLabel: string;
  locationLabel: string;
  latitude: string;
  longitude: string;
  utcOffset: string;
  timezone: string;
  daylightSaving: string;
  timezoneIdentifier: string;
  julianDay?: string;
};

export type ChartPoint = {
  id: ChartPointId;
  glyph: string;
  longitude: number;
  sign: SignId;
  degreeLabel: string;
  degreeInSign: number;
  minutesInSign: number;
  absoluteLongitudeLabel: string;
  house: number;
  color: string;
  retrograde?: boolean;
};

export type HouseCusp = {
  house: number;
  longitude: number;
};

export type Aspect = {
  id: string;
  type: AspectId;
  from: ChartPointId;
  to: ChartPointId;
  orb: number;
};

export type ChartMeta = {
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
  solarReturnYear?: number;
};

export type NatalChartData = {
  event: ChartEventMeta;
  settings: ChartSettings;
  points: ChartPoint[];
  houses: HouseCusp[];
  aspects: Aspect[];
  meta: ChartMeta;
  extendedPoints?: ChartPoint[];
};

export function normalizeLongitude(longitude: number): number {
  const normalized = longitude % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function getSignFromLongitude(longitude: number): SignId {
  const normalized = normalizeLongitude(longitude);
  return zodiacSigns[Math.floor(normalized / 30)]!.id;
}

export function getSignMeta(signId: SignId) {
  return zodiacSigns.find((sign) => sign.id === signId)!;
}

export function getDegreeInSign(longitude: number): number {
  return Math.floor(normalizeLongitude(longitude) % 30);
}

export function getMinutesInSign(longitude: number): number {
  const withinSign = normalizeLongitude(longitude) % 30;
  return Math.round((withinSign - Math.floor(withinSign)) * 60);
}

export function toZodiacDegreeLabel(longitude: number): string {
  const degree = getDegreeInSign(longitude);
  const minutes = getMinutesInSign(longitude);
  return `${degree}° ${minutes.toString().padStart(2, "0")}′`;
}

export function toAbsoluteLongitudeLabel(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  const degree = Math.floor(normalized);
  const minutes = Math.round((normalized - degree) * 60);
  return `${degree}° ${minutes.toString().padStart(2, "0")}′`;
}

export function formatSignPosition(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const sign = getSignFromLongitude(normalized);

  return {
    sign,
    signGlyph: zodiacSigns.find((entry) => entry.id === sign)?.glyph ?? "",
    degreeLabel: toZodiacDegreeLabel(normalized),
    absoluteLongitudeLabel: toAbsoluteLongitudeLabel(normalized),
    degreeInSign: getDegreeInSign(normalized),
    minutesInSign: getMinutesInSign(normalized),
  };
}

function buildDerivedPoint(
  id: ChartPointId,
  glyph: string,
  longitude: number,
  house: number,
  color: string,
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
    house,
    color,
    retrograde,
  };
}

export function getAugmentedChartPoints(chart: NatalChartData) {
  const points = [...chart.points];
  const hasSouthNode = points.some((point) => point.id === "southNode");
  const hasPartOfFortune = points.some((point) => point.id === "partOfFortune");
  const northNode = points.find((point) => point.id === "northNode");
  const sun = points.find((point) => point.id === "sun");
  const moon = points.find((point) => point.id === "moon");

  if (northNode && !hasSouthNode) {
    points.push(
      buildDerivedPoint(
        "southNode",
        "☋",
        northNode.longitude + 180,
        ((northNode.house + 5) % 12) + 1,
        "#8f8798",
        northNode.retrograde,
      ),
    );
  }

  if (sun && moon && !hasPartOfFortune) {
    const isDayChart = sun.house >= 7 && sun.house <= 12;
    const longitude = isDayChart
      ? chart.meta.ascendant + moon.longitude - sun.longitude
      : chart.meta.ascendant + sun.longitude - moon.longitude;

    points.push(
      buildDerivedPoint(
        "partOfFortune",
        "⊗",
        longitude,
        sun.house,
        "#f1d28f",
      ),
    );
  }

  return points;
}

function point(
  id: ChartPointId,
  glyph: string,
  longitude: number,
  house: number,
  color: string,
  retrograde = false,
): ChartPoint {
  return {
    id,
    glyph,
    longitude,
    sign: getSignFromLongitude(longitude),
    degreeLabel: toZodiacDegreeLabel(longitude),
    degreeInSign: getDegreeInSign(longitude),
    minutesInSign: getMinutesInSign(longitude),
    absoluteLongitudeLabel: toAbsoluteLongitudeLabel(longitude),
    house,
    color,
    retrograde,
  };
}

export const mockNatalChart: NatalChartData = {
  event: {
    name: "Demo",
    title: "Carta natal",
    dateLabel: "23 abril 2026 · 18:36",
    locationLabel: "Barcelona, Cataluña, España",
    latitude: "41° 23′ 19″ N",
    longitude: "2° 9′ 32″ E",
    utcOffset: "UTC+02:00",
    timezone: "CEST",
    daylightSaving: "Sí",
    timezoneIdentifier: "Europe/Madrid",
    julianDay: "2461185.280000",
  },
  settings: {
    zodiac: "tropical",
    houseSystem: "placidus",
    locus: "geocentric",
    chartMethod: "natal",
    calculationMethod: "swissEphemeris",
  },
  meta: {
    ascendant: 180,
    mc: 90,
    descendant: 0,
    ic: 270,
  },
  houses: [
    { house: 1, longitude: 180 },
    { house: 2, longitude: 211 },
    { house: 3, longitude: 242 },
    { house: 4, longitude: 270 },
    { house: 5, longitude: 301 },
    { house: 6, longitude: 332 },
    { house: 7, longitude: 0 },
    { house: 8, longitude: 31 },
    { house: 9, longitude: 62 },
    { house: 10, longitude: 90 },
    { house: 11, longitude: 121 },
    { house: 12, longitude: 152 },
  ],
  points: [
    point("sun", "☉", 3.53, 7, "#ffcf7b"),
    point("moon", "☽", 118.28, 10, "#d9ddff"),
    point("mercury", "☿", 13.1, 7, "#9de6f2"),
    point("venus", "♀", 57.42, 8, "#f0b7d4"),
    point("mars", "♂", 10.75, 7, "#ff6b86"),
    point("jupiter", "♃", 107.95, 10, "#9b90ff"),
    point("saturn", "♄", 8.18, 7, "#bea3d2"),
    point("uranus", "♅", 59.48, 8, "#7ce3d2"),
    point("neptune", "♆", 3.04, 6, "#8f98ff"),
    point("pluto", "♇", 305.47, 4, "#d768bd"),
    point("northNode", "☊", 337.33, 5, "#d2d0d8", true),
    point("southNode", "☋", 157.33, 11, "#8f8798", true),
    point("chiron", "⚷", 27.42, 7, "#ceb39b"),
  ],
  aspects: [
    { id: "sun-jupiter", type: "square", from: "sun", to: "jupiter", orb: 2.8 },
    { id: "moon-mars", type: "trine", from: "moon", to: "mars", orb: 1.2 },
    { id: "moon-neptune", type: "square", from: "moon", to: "neptune", orb: 3.4 },
    { id: "mercury-jupiter", type: "square", from: "mercury", to: "jupiter", orb: 1 },
    { id: "venus-pluto", type: "trine", from: "venus", to: "pluto", orb: 2.1 },
    { id: "mars-jupiter", type: "square", from: "mars", to: "jupiter", orb: 0.8 },
    { id: "saturn-jupiter", type: "square", from: "saturn", to: "jupiter", orb: 0.2 },
    { id: "neptune-sun", type: "conjunction", from: "neptune", to: "sun", orb: 0.5 },
    { id: "pluto-sun", type: "sextile", from: "pluto", to: "sun", orb: 1.8 },
  ],
};
