import { getSignFromLongitude, type ChartPointId, type Element, type NatalChartData, zodiacSigns } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import { yogaRoutines, type Asana } from "@/data/sarita/yoga-routines";

export type RoutineElement = keyof typeof yogaRoutines;

export type PersonalizedYogaRoutine = {
  primary: RoutineElement;
  secondary: RoutineElement | null;
  primaryPercent: number;
  secondaryPercent: number;
  monthKey: string;
  asanas: Asana[];
};

const TRADITIONAL_POINT_IDS = new Set<ChartPointId>([
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
]);

const ELEMENT_ORDER: Element[] = ["fire", "earth", "air", "water"];

export function toRoutineElement(element: Element): RoutineElement {
  return element === "fire"
    ? "fuego"
    : element === "earth"
      ? "tierra"
      : element === "water"
        ? "agua"
        : "aire";
}

export function getElementCounts(chart: NatalChartData): Record<Element, number> {
  const counts: Record<Element, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };

  for (const point of chart.points) {
    if (!TRADITIONAL_POINT_IDS.has(point.id)) {
      continue;
    }

    const signMeta = zodiacSigns.find((entry) => entry.id === point.sign);
    if (signMeta) {
      counts[signMeta.element] += 1;
    }
  }

  const ascendantSign = getSignFromLongitude(chart.meta.ascendant);
  const ascendantMeta = zodiacSigns.find((entry) => entry.id === ascendantSign);
  if (ascendantMeta) {
    counts[ascendantMeta.element] += 1;
  }

  return counts;
}

export function getSortedElements(chart: NatalChartData) {
  const counts = getElementCounts(chart);
  return ELEMENT_ORDER
    .map((element) => ({ element, count: counts[element] }))
    .sort((left, right) => right.count - left.count);
}

export function getDominantElement(chart: NatalChartData): Element {
  return getSortedElements(chart)[0]?.element ?? "fire";
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seed: string) {
  const next = [...items];
  let state = hashString(seed);

  for (let index = next.length - 1; index > 0; index -= 1) {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    const swapIndex = state % (index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }

  return next;
}

function pickAsanas(element: RoutineElement, count: number, seed: string) {
  const routine = yogaRoutines[element];
  const indexed = routine.asanas.map((asana, index) => ({ asana, index }));
  const selected = seededShuffle(indexed, `${seed}:${element}`)
    .slice(0, Math.min(count, indexed.length))
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.asana);

  if (element === "tierra" && routine.asanas[0]?.slug === "mula-bandha" && !selected.some((asana) => asana.slug === "mula-bandha")) {
    return [routine.asanas[0], ...selected.slice(0, Math.max(0, count - 1))];
  }

  return selected;
}

export async function getPersonalizedYogaRoutine(chart: NatalChartData, date = new Date()): Promise<PersonalizedYogaRoutine> {
  const chartHash = await hashNatalChart(chart);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const [first, second] = getSortedElements(chart);
  const primary = toRoutineElement(first?.element ?? "fire");
  const secondary = second && second.count > 0 ? toRoutineElement(second.element) : null;
  const hasCloseSecondary = Boolean(second && second.count > 0 && (first?.count ?? 0) - second.count <= 3);
  const primaryPercent = secondary && hasCloseSecondary ? (first?.count === second?.count ? 60 : 70) : 100;
  const secondaryPercent = secondary && hasCloseSecondary ? 100 - primaryPercent : 0;
  const targetCount = 7;
  const secondaryCount = secondaryPercent > 0 ? Math.max(2, Math.round(targetCount * (secondaryPercent / 100))) : 0;
  const primaryCount = targetCount - secondaryCount;
  const seed = `${chartHash}:${monthKey}:${primary}:${secondary ?? "solo"}`;
  const primaryAsanas = pickAsanas(primary, primaryCount, `${seed}:primary`);
  const secondaryAsanas = secondary && secondaryCount > 0 ? pickAsanas(secondary, secondaryCount, `${seed}:secondary`) : [];

  return {
    primary,
    secondary: secondaryCount > 0 ? secondary : null,
    primaryPercent,
    secondaryPercent,
    monthKey,
    asanas: [...primaryAsanas, ...secondaryAsanas],
  };
}
