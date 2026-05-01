import type { Aspect, AspectId, ChartPoint, ChartPointId, NatalChartData, SignId } from "@/lib/chart";
import { formatSignPosition, getAugmentedChartPoints, normalizeLongitude, zodiacSigns } from "@/lib/chart";

const RULER_BY_SIGN: Record<SignId, { modern: ChartPointId; traditional?: ChartPointId; label: string }> = {
  aries: { modern: "mars", label: "Marte" },
  taurus: { modern: "venus", label: "Venus" },
  gemini: { modern: "mercury", label: "Mercurio" },
  cancer: { modern: "moon", label: "Luna" },
  leo: { modern: "sun", label: "Sol" },
  virgo: { modern: "mercury", label: "Mercurio" },
  libra: { modern: "venus", label: "Venus" },
  scorpio: { modern: "pluto", traditional: "mars", label: "Pluton / Marte" },
  sagittarius: { modern: "jupiter", label: "Jupiter" },
  capricorn: { modern: "saturn", label: "Saturno" },
  aquarius: { modern: "uranus", traditional: "saturn", label: "Urano / Saturno" },
  pisces: { modern: "neptune", traditional: "jupiter", label: "Neptuno / Jupiter" },
};

const PATTERN_POINT_IDS = new Set<ChartPointId>([
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
]);

const ELEMENT_LABELS = {
  fire: "Fuego",
  earth: "Tierra",
  air: "Aire",
  water: "Agua",
} as const;

export type ChartPattern = {
  type: "t-square" | "grand-trine" | "yod" | "stellium-sign" | "stellium-house";
  title: string;
  points: ChartPointId[];
};

function pointById(points: ChartPoint[], id: ChartPointId) {
  return points.find((point) => point.id === id);
}

function aspectBetween(aspects: Aspect[], first: ChartPointId, second: ChartPointId, type: AspectId) {
  return aspects.find((aspect) =>
    aspect.type === type &&
    ((aspect.from === first && aspect.to === second) || (aspect.from === second && aspect.to === first)),
  );
}

function uniqueIds(ids: ChartPointId[]) {
  return Array.from(new Set(ids));
}

export function getChartRuler(chart: NatalChartData) {
  const ascSign = formatSignPosition(chart.meta.ascendant).sign;
  const ruler = RULER_BY_SIGN[ascSign];
  const points = getAugmentedChartPoints(chart);
  return {
    ascSign,
    label: ruler.label,
    primary: pointById(points, ruler.modern),
    traditional: ruler.traditional ? pointById(points, ruler.traditional) : null,
  };
}

export function getRetrogradePoints(chart: NatalChartData) {
  return getAugmentedChartPoints(chart)
    .filter((point) => point.retrograde && PATTERN_POINT_IDS.has(point.id))
    .sort((left, right) => left.house - right.house);
}

export function detectChartPatterns(chart: NatalChartData): ChartPattern[] {
  const points = chart.points.filter((point) => PATTERN_POINT_IDS.has(point.id));
  const patterns: ChartPattern[] = [];

  for (const focal of points) {
    const squares = points.filter((point) => point.id !== focal.id && aspectBetween(chart.aspects, focal.id, point.id, "square"));
    for (let i = 0; i < squares.length; i += 1) {
      for (let j = i + 1; j < squares.length; j += 1) {
        const first = squares[i]!;
        const second = squares[j]!;
        if (aspectBetween(chart.aspects, first.id, second.id, "opposition")) {
          patterns.push({
            type: "t-square",
            title: `T-cuadrada con foco en ${focal.glyph}`,
            points: uniqueIds([focal.id, first.id, second.id]),
          });
        }
      }
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      for (let k = j + 1; k < points.length; k += 1) {
        const trio = [points[i]!, points[j]!, points[k]!];
        const allTrines =
          aspectBetween(chart.aspects, trio[0].id, trio[1].id, "trine") &&
          aspectBetween(chart.aspects, trio[1].id, trio[2].id, "trine") &&
          aspectBetween(chart.aspects, trio[0].id, trio[2].id, "trine");
        if (allTrines) {
          const element = zodiacSigns.find((sign) => sign.id === trio[0].sign)?.element;
          patterns.push({
            type: "grand-trine",
            title: `Gran trigono${element ? ` de ${ELEMENT_LABELS[element]}` : ""}`,
            points: trio.map((point) => point.id),
          });
        }
      }
    }
  }

  for (const apex of points) {
    const quincunxes = points.filter((point) => point.id !== apex.id && aspectBetween(chart.aspects, apex.id, point.id, "quincunx"));
    for (let i = 0; i < quincunxes.length; i += 1) {
      for (let j = i + 1; j < quincunxes.length; j += 1) {
        const first = quincunxes[i]!;
        const second = quincunxes[j]!;
        if (aspectBetween(chart.aspects, first.id, second.id, "sextile")) {
          patterns.push({
            type: "yod",
            title: `Yod con apex en ${apex.glyph}`,
            points: uniqueIds([apex.id, first.id, second.id]),
          });
        }
      }
    }
  }

  const bySign = new Map<SignId, ChartPoint[]>();
  const byHouse = new Map<number, ChartPoint[]>();
  for (const point of points) {
    bySign.set(point.sign, [...(bySign.get(point.sign) ?? []), point]);
    byHouse.set(point.house, [...(byHouse.get(point.house) ?? []), point]);
  }

  for (const [sign, signPoints] of bySign) {
    if (signPoints.length >= 3) {
      patterns.push({
        type: "stellium-sign",
        title: `Stellium en ${sign}`,
        points: signPoints.map((point) => point.id),
      });
    }
  }

  for (const [house, housePoints] of byHouse) {
    if (housePoints.length >= 3) {
      patterns.push({
        type: "stellium-house",
        title: `Stellium en casa ${house}`,
        points: housePoints.map((point) => point.id),
      });
    }
  }

  const seen = new Set<string>();
  return patterns.filter((pattern) => {
    const key = `${pattern.type}-${pattern.points.slice().sort().join("-")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

export function distanceToNodeAxis(longitude: number, northNodeLongitude: number) {
  const northDistance = Math.abs(normalizeLongitude(longitude - northNodeLongitude));
  const wrappedNorth = northDistance > 180 ? 360 - northDistance : northDistance;
  const southDistance = Math.abs(normalizeLongitude(longitude - normalizeLongitude(northNodeLongitude + 180)));
  const wrappedSouth = southDistance > 180 ? 360 - southDistance : southDistance;
  return Math.min(wrappedNorth, wrappedSouth);
}
