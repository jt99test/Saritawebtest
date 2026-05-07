import { DateTime } from "luxon";

import type { Element, NatalChartData } from "@/lib/chart";
import { getSignMeta } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import type { LunarReportMetadata } from "@/lib/lunar-report";
import {
  buildYogaRoutineFromElementScores,
  type PersonalizedYogaRoutine,
  type RoutineElementScore,
} from "@/lib/personalized-yoga";

const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];

const HOUSE_ELEMENTS: Record<number, Element> = {
  1: "fire",
  2: "earth",
  3: "air",
  4: "water",
  5: "fire",
  6: "earth",
  7: "air",
  8: "water",
  9: "fire",
  10: "earth",
  11: "air",
  12: "water",
};

const ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 1.45,
  opposition: 1.3,
  square: 1.25,
  trine: 1.05,
  sextile: 0.95,
  quincunx: 0.9,
};

const STRENGTH_WEIGHT: Record<string, number> = {
  tight: 1.4,
  moderate: 1,
  wide: 0.72,
};

function emptyScores(): Record<Element, number> {
  return {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };
}

function addScore(scores: Record<Element, number>, element: Element | undefined, value: number) {
  if (!element) {
    return;
  }

  scores[element] += value;
}

function natalPointElement(chart: NatalChartData, pointId: string): Element | undefined {
  const point = chart.points.find((entry) => entry.id === pointId) ?? chart.extendedPoints?.find((entry) => entry.id === pointId);
  return point ? getSignMeta(point.sign).element : undefined;
}

export async function getLunarYogaRoutine(
  chart: NatalChartData,
  metadata: LunarReportMetadata,
): Promise<PersonalizedYogaRoutine> {
  const scores = emptyScores();
  const lunationElement = metadata.element;
  const activatedHouseElement = HOUSE_ELEMENTS[metadata.activatedHouse];

  addScore(scores, lunationElement, 1.2);
  addScore(scores, activatedHouseElement, 0.75);

  for (const transit of metadata.activeTransits) {
    const baseWeight =
      (ASPECT_WEIGHT[transit.aspectType] ?? 1) *
      (STRENGTH_WEIGHT[transit.strength] ?? 1) *
      Math.max(0.45, 2.3 - transit.orb);
    const natalElement = transit.natalElement ?? natalPointElement(chart, transit.natalPlanet);

    addScore(scores, transit.transitingElement, baseWeight * 0.58);
    addScore(scores, natalElement, baseWeight * 0.42);

    for (const natalAspect of transit.activatedNatalAspects ?? []) {
      addScore(scores, natalPointElement(chart, natalAspect.pointA), baseWeight * 0.12);
      addScore(scores, natalPointElement(chart, natalAspect.pointB), baseWeight * 0.12);
    }
  }

  if (ELEMENTS.every((element) => scores[element] <= 0)) {
    scores[lunationElement] = 1;
  }

  const chartHash = await hashNatalChart(chart);
  const exactMoon = DateTime.fromISO(metadata.timestamp, { zone: "utc" });
  const monthKey = `${metadata.year}-${String(metadata.month).padStart(2, "0")}-${metadata.lunationType}`;
  const scoreKey = ELEMENTS.map((element) => `${element}:${scores[element].toFixed(3)}`).join("|");
  const seed = `${chartHash}:lunar-yoga:${metadata.timestamp}:${metadata.lunationType}:${scoreKey}:${exactMoon.toFormat("yyyy-LL-dd-HH")}`;
  const normalizedScores: RoutineElementScore[] = ELEMENTS.map((element) => ({
    element,
    score: scores[element],
  }));
  return buildYogaRoutineFromElementScores({
    scores: normalizedScores,
    seed,
    monthKey,
  });
}
