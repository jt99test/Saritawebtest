import { getSignFromLongitude, type ChartPointId, type Element, type NatalChartData, zodiacSigns } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import { yogaRoutines, type Asana } from "@/data/sarita/yoga-routines";

export type RoutineElement = keyof typeof yogaRoutines;

export type PersonalizedYogaRoutine = {
  id: string;
  primary: RoutineElement;
  secondary: RoutineElement | null;
  accent: RoutineElement | null;
  primaryPercent: number;
  secondaryPercent: number;
  accentPercent: number;
  monthKey: string;
  asanas: Asana[];
};

export type RoutineElementScore = {
  element: Element;
  score: number;
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

const POINT_WEIGHTS: Partial<Record<ChartPointId, number>> = {
  sun: 1.35,
  moon: 1.35,
  mercury: 1,
  venus: 1,
  mars: 1.05,
  jupiter: 0.95,
  saturn: 0.95,
  uranus: 0.75,
  neptune: 0.75,
  pluto: 0.75,
};

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

function seededNumber(seed: string) {
  return hashString(seed) / 0xffffffff;
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

function getChartVariationKey(chart: NatalChartData) {
  const pointKey = chart.points
    .filter((point) => TRADITIONAL_POINT_IDS.has(point.id))
    .map((point) => `${point.id}:${point.sign}:${point.house}:${point.degreeInSign.toFixed(2)}:${point.longitude.toFixed(2)}`)
    .join("|");
  const houseKey = chart.houses
    .map((house) => `${house.house}:${house.longitude.toFixed(2)}`)
    .join("|");
  const ascendant = chart.meta.ascendant.toFixed(2);
  const mc = chart.meta.mc.toFixed(2);

  return `${pointKey}|houses:${houseKey}|angles:${ascendant}:${mc}`;
}

function getRotationKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeightedElementScores(chart: NatalChartData, seed: string) {
  const scores: Record<Element, number> = {
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
      scores[signMeta.element] += POINT_WEIGHTS[point.id] ?? 1;
    }
  }

  const ascendantSign = getSignFromLongitude(chart.meta.ascendant);
  const ascendantMeta = zodiacSigns.find((entry) => entry.id === ascendantSign);
  if (ascendantMeta) {
    scores[ascendantMeta.element] += 1.45;
  }

  const mcSign = getSignFromLongitude(chart.meta.mc);
  const mcMeta = zodiacSigns.find((entry) => entry.id === mcSign);
  if (mcMeta) {
    scores[mcMeta.element] += 0.65;
  }

  return ELEMENT_ORDER
    .map((element) => ({
      element,
      score: scores[element],
      tieBreaker: seededNumber(`${seed}:element-order:${element}`),
    }))
    .sort((left, right) => {
      const byScore = right.score - left.score;
      return Math.abs(byScore) > 0.0001 ? byScore : right.tieBreaker - left.tieBreaker;
    });
}

export function buildYogaRoutineFromElementScores({
  scores,
  seed,
  monthKey,
}: {
  scores: RoutineElementScore[];
  seed: string;
  monthKey: string;
}): PersonalizedYogaRoutine {
  const scoredElements = scores
    .filter((entry) => entry.score > 0)
    .map((entry) => ({
      ...entry,
      tieBreaker: seededNumber(`${seed}:element-order:${entry.element}`),
    }))
    .sort((left, right) => {
      const byScore = right.score - left.score;
      return Math.abs(byScore) > 0.0001 ? byScore : right.tieBreaker - left.tieBreaker;
    });
  const selectedElements = scoredElements.slice(0, Math.min(3, scoredElements.length));
  const [first, second, third] = selectedElements;
  const primary = toRoutineElement(first?.element ?? "fire");
  const secondary = second ? toRoutineElement(second.element) : null;
  const accent = third ? toRoutineElement(third.element) : null;
  const [primaryPercent = 100, secondaryPercent = 0, accentPercent = 0] = normalizePercents(selectedElements);
  const targetCount = 7;
  const [primaryCount = targetCount, secondaryCount = 0, accentCount = 0] = allocatePoseCounts(
    [primaryPercent, secondaryPercent, accentPercent].filter((value) => value > 0),
    seed,
    targetCount,
  );
  const usedSlugs = new Set<string>();
  const primaryAsanas = pickAsanas(primary, primaryCount, `${seed}:primary`, usedSlugs);
  primaryAsanas.forEach((asana) => usedSlugs.add(asana.slug));
  const secondaryAsanas = secondary && secondaryCount > 0 ? pickAsanas(secondary, secondaryCount, `${seed}:secondary`, usedSlugs) : [];
  secondaryAsanas.forEach((asana) => usedSlugs.add(asana.slug));
  const accentAsanas = accent && accentCount > 0 ? pickAsanas(accent, accentCount, `${seed}:accent`, usedSlugs) : [];
  const asanas = weaveAsanas([primaryAsanas, secondaryAsanas, accentAsanas].filter((group) => group.length > 0), seed);
  const id = hashString(`${seed}:${asanas.map((asana) => `${asana.element}:${asana.slug}`).join("|")}`).toString(36);

  return {
    id,
    primary,
    secondary: secondaryCount > 0 ? secondary : null,
    accent: accentCount > 0 ? accent : null,
    primaryPercent,
    secondaryPercent,
    accentPercent,
    monthKey,
    asanas,
  };
}

function normalizePercents(scores: Array<{ score: number }>) {
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  if (total <= 0) {
    return [100];
  }

  const raw = scores.map((item) => (item.score / total) * 100);
  const rounded = raw.map((value) => Math.max(1, Math.round(value)));
  const delta = 100 - rounded.reduce((sum, value) => sum + value, 0);
  rounded[0] = (rounded[0] ?? 100) + delta;

  return rounded;
}

function allocatePoseCounts(
  shares: number[],
  seed: string,
  targetCount: number,
) {
  if (shares.length <= 1) {
    return [targetCount];
  }

  if (shares.length === 2) {
    const spread = shares[0]! - shares[1]!;
    const closeBlend = spread <= 18 || seededNumber(`${seed}:two-way-close`) > 0.72;
    return closeBlend ? [4, 3] : [5, 2];
  }

  const spread = shares[0]! - shares[1]!;
  const accentShare = shares[2]!;
  const variant = seededNumber(`${seed}:three-way-shape`);

  if (spread <= 12 && accentShare >= 18) {
    return variant > 0.5 ? [3, 2, 2] : [3, 3, 1];
  }

  if (shares[0]! >= 62 && accentShare <= 12) {
    return variant > 0.42 ? [5, 1, 1] : [4, 2, 1];
  }

  return variant > 0.65 ? [3, 3, 1] : [4, 2, 1];
}

function pickAsanas(
  element: RoutineElement,
  count: number,
  seed: string,
  avoidSlugs = new Set<string>(),
) {
  const routine = yogaRoutines[element];
  const indexed = routine.asanas.map((asana, index) => ({ asana, index }));
  const shuffled = seededShuffle(indexed, `${seed}:${element}`);
  const selected = [
    ...shuffled.filter((entry) => !avoidSlugs.has(entry.asana.slug)),
    ...shuffled.filter((entry) => avoidSlugs.has(entry.asana.slug)),
  ]
    .slice(0, Math.min(count, indexed.length))
    .map((entry) => entry.asana);

  const shouldIncludeRootLock =
    element === "tierra" &&
    count >= 3 &&
    routine.asanas[0]?.slug === "mula-bandha" &&
    seededNumber(`${seed}:mula-bandha`) > 0.48 &&
    !selected.some((asana) => asana.slug === "mula-bandha");

  if (shouldIncludeRootLock) {
    return [routine.asanas[0], ...selected.slice(0, Math.max(0, count - 1))];
  }

  return selected;
}

function weaveAsanas(groups: Asana[][], seed: string) {
  const buckets = groups.map((items, index) => ({
    index,
    items: seededShuffle(items, `${seed}:bucket:${index}`),
  }));
  const pattern = seededShuffle(
    buckets.flatMap((bucket) => bucket.items.map(() => bucket.index)),
    `${seed}:pattern`,
  );
  const usedByBucket = new Map<number, number>();

  return pattern.flatMap((bucketIndex) => {
    const bucket = buckets[bucketIndex];
    if (!bucket) {
      return [];
    }

    const used = usedByBucket.get(bucketIndex) ?? 0;
    const asana = bucket.items[used];
    usedByBucket.set(bucketIndex, used + 1);
    return asana ? [asana] : [];
  });
}

export async function getPersonalizedYogaRoutine(chart: NatalChartData, date = new Date()): Promise<PersonalizedYogaRoutine> {
  const chartHash = await hashNatalChart(chart);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rotationKey = getRotationKey(date);
  const variationKey = getChartVariationKey(chart);
  const seed = `${chartHash}:${variationKey}:${rotationKey}`;
  return buildYogaRoutineFromElementScores({
    scores: getWeightedElementScores(chart, seed),
    seed,
    monthKey,
  });
}
