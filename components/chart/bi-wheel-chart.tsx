"use client";

import { useMemo, useState } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import type { AnglePointId, ChartPoint, ChartPointId, ChartReferencePointId, HouseCusp, NatalChartData } from "@/lib/chart";
import { getAugmentedChartPoints, getHouseForLongitude, normalizeLongitude, zodiacSigns } from "@/lib/chart";
import { getPointLabel } from "@/lib/chart-labels";
import type { SynastryAspect } from "@/lib/synastry";

export type BiWheelContext = "solar-return" | "synastry" | "transits";
export type BiWheelVariant = "solar-return" | "synastry";

type BiWheelChartProps = {
  innerChart: NatalChartData;
  outerChart?: NatalChartData;
  innerLabel?: string;
  outerLabel?: string;
  variant?: BiWheelVariant;
  context?: BiWheelContext;
  innerPointIds?: ChartPointId[];
  outerPointIds?: ChartPointId[];
  interAspects?: BiWheelInterAspect[];
  showOuterAspects?: boolean;
  showInterAspects?: boolean;
  selectedInnerPointId?: ChartPointId | null;
  selectedOuterPointId?: ChartPointId | null;
  onInnerPlanetSelect?: (pointId: ChartPointId | null) => void;
  onOuterPlanetSelect?: (pointId: ChartPointId | null) => void;
};

export type BiWheelInterAspect = Omit<SynastryAspect, "pointA" | "pointB"> & {
  pointA: ChartReferencePointId;
  pointB: ChartReferencePointId;
};

type HoveredPointTag = {
  id: ChartPointId;
  x: number;
  y: number;
};

const ANGLE_POINT_IDS = new Set<ChartReferencePointId>(["ascendant", "descendant", "mc", "ic"]);

function isChartPointId(pointId: ChartReferencePointId): pointId is ChartPointId {
  return !ANGLE_POINT_IDS.has(pointId);
}

const CHART_SIZE = 1060;
const CENTER = CHART_SIZE / 2;
const ZODIAC_OUTER_R = 502;
const ZODIAC_INNER_R = 444;
const INNER_PLANET_LABEL_R = 238;
const OUTER_SEP_R = 288;
const OUTER_PLANET_R = 390;
const OUTER_LABEL_R = 514;
const PLANET_GROUP_DIVIDER_R = OUTER_SEP_R;
const CLUSTER_THRESHOLD_DEGREES = 5;
const CLUSTER_FAN_STEP = 14;
const CONFLICT_DEGREES = 4;
const INNER_CLUSTER_CALLOUT_R = ZODIAC_OUTER_R + 16;
const OUTER_CLUSTER_CALLOUT_R = ZODIAC_OUTER_R + 20;
const HOUSE_OUTER_R = 252;
const HOUSE_INNER_R = 142;
const HOUSE_NUMBER_R = 162;
const HOUSE_NUMBER_LABEL_R = 152;
const SOLAR_HOUSE_RING_INNER_R = OUTER_SEP_R + 12;
const SOLAR_HOUSE_RING_OUTER_R = ZODIAC_INNER_R - 8;
const SOLAR_HOUSE_NUMBER_R = SOLAR_HOUSE_RING_OUTER_R - 14;
const PLANET_EDGE_MARGIN = 34;
const DRAWABLE_IDS = new Set<ChartPointId>([
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
  "ceres",
]);

const POINT_SYMBOLS: Record<ChartPointId, string> = {
  sun: "\u2609",
  moon: "\u263d",
  mercury: "\u263f",
  venus: "\u2640",
  mars: "\u2642",
  jupiter: "\u2643",
  saturn: "\u2644",
  uranus: "\u2645",
  neptune: "\u2646",
  pluto: "\u2647",
  northNode: "\u260a",
  southNode: "\u260b",
  chiron: "\u26b7",
  partOfFortune: "\u2297",
  lilith: "\u26b8",
  ceres: "\u26b3",
};

const PLANET_GLYPH_INK: Partial<Record<ChartPointId, string>> = {
  sun: "#b56b00",
  moon: "#4d4f7d",
  mercury: "#027a8a",
  venus: "#b33978",
  mars: "#b5332f",
  jupiter: "#4f55c8",
  saturn: "#76619c",
  uranus: "#007f91",
  neptune: "#4c62b8",
  pluto: "#9f407c",
  northNode: "#7d7f98",
  southNode: "#7d7f98",
  chiron: "#8a5b31",
  partOfFortune: "#9b6a00",
  lilith: "#7f4f99",
  ceres: "#8a5b31",
};

function planetGlyphInk(pointId: ChartPointId) {
  return PLANET_GLYPH_INK[pointId] ?? "#061331";
}

const PLANET_GLYPH_OFFSETS: Partial<Record<ChartPointId, { x: number; y: number }>> = {
  sun: { x: 0, y: 1 },
  moon: { x: -0.5, y: 0.5 },
  mercury: { x: 0, y: 1 },
  venus: { x: 0, y: 1 },
  mars: { x: 0.5, y: 1 },
  jupiter: { x: 0, y: 1 },
  saturn: { x: 0, y: 1 },
  uranus: { x: 0, y: 1.5 },
  neptune: { x: 0, y: 1 },
  pluto: { x: 0, y: 1 },
  northNode: { x: 0, y: 2.2 },
  southNode: { x: 0, y: 2.2 },
  chiron: { x: 0, y: 1.3 },
  partOfFortune: { x: 0, y: -1 },
  lilith: { x: 0, y: 1.4 },
  ceres: { x: 0, y: 1.4 },
};

function planetGlyphOffset(pointId: ChartPointId) {
  return PLANET_GLYPH_OFFSETS[pointId] ?? { x: 0, y: 0 };
}

const VARIANTS = {
  "solar-return": {
    primary: "#f5d782",
    muted: "rgba(232,243,255,0.9)",
    ring: "rgba(245,215,130,0.5)",
    bg: "rgba(0,102,255,0.12)",
  },
  synastry: {
    primary: "#f5d782",
    muted: "rgba(232,243,255,0.9)",
    ring: "rgba(245,215,130,0.5)",
    bg: "rgba(0,102,255,0.12)",
  },
} as const;

const ELEMENT_TINTS = {
  fire: "rgba(255,105,145,0.14)",
  earth: "rgba(245,215,130,0.12)",
  air: "rgba(86,178,255,0.14)",
  water: "rgba(84,245,220,0.12)",
} as const;

function biWheelExplainer(context: BiWheelContext, locale: string, innerLabel: string, outerLabel?: string) {
  const outer = outerLabel ?? (locale === "en" ? "outer chart" : locale === "it" ? "carta esterna" : "carta exterior");

  if (locale === "en") {
    if (context === "solar-return") {
      return `Inner chart: your natal chart. Outer chart: ${outer}, the sky of this Solar Return year. The dashed outer house band belongs to the Solar Return.`;
    }
    if (context === "transits") {
      return `Inner chart: your natal chart. Outer chart: ${outer}, the current sky moving through your natal houses.`;
    }
    return `Inner chart: ${innerLabel}. Outer chart: ${outer}. The overlay shows how both charts speak to each other.`;
  }

  if (locale === "it") {
    if (context === "solar-return") {
      return `Carta interna: la tua carta natale. Carta esterna: ${outer}, il cielo della Rivoluzione Solare. La fascia esterna tratteggiata appartiene alla Rivoluzione Solare.`;
    }
    if (context === "transits") {
      return `Carta interna: la tua carta natale. Carta esterna: ${outer}, il cielo attuale che si muove nelle tue case natali.`;
    }
    return `Carta interna: ${innerLabel}. Carta esterna: ${outer}. La sovrapposizione mostra come dialogano le due carte.`;
  }

  if (context === "solar-return") {
    return `Carta interna: tu carta natal. Carta externa: ${outer}, el cielo de esta Revolución Solar. La banda exterior punteada pertenece a la Revolución Solar.`;
  }
  if (context === "transits") {
    return `Carta interna: tu carta natal. Carta externa: ${outer}, el cielo actual moviéndose por tus casas natales.`;
  }
  return `Carta interna: ${innerLabel}. Carta externa: ${outer}. La superposición muestra cómo dialogan ambas cartas.`;
}

function biWheelAccuracyNote(locale: string) {
  if (locale === "en") {
    return "Precision note: when several planets are close together, the graphic may separate them slightly so they remain readable. Use the degree, sign, and minutes as the exact position.";
  }

  if (locale === "it") {
    return "Nota di precisione: quando vari pianeti sono molto vicini, il grafico puo separarli leggermente per mantenerli leggibili. Usa grado, segno e minuti come posizione esatta.";
  }

  return "Nota de precision: cuando varios planetas estan muy cerca, el grafico puede separarlos ligeramente para que se lean mejor. Usa el grado, signo y minutos como posicion exacta.";
}

function pointAngle(longitude: number, ascendant: number) {
  return 180 + ascendant - longitude;
}

function pointAtRadius(radius: number, longitude: number, ascendant: number) {
  const angle = (pointAngle(longitude, ascendant) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function angleLongitude(chart: NatalChartData, angle: AnglePointId) {
  if (angle === "ascendant") return chart.meta.ascendant;
  if (angle === "descendant") return chart.meta.descendant;
  if (angle === "mc") return chart.meta.mc;
  return chart.meta.ic;
}

function aspectEndpoint({
  pointId,
  chart,
  points,
  layouts,
  ascendant,
  angleRadius,
}: {
  pointId: ChartReferencePointId;
  chart: NatalChartData;
  points: ChartPoint[];
  layouts: Map<ChartPointId, { x: number; y: number }>;
  ascendant: number;
  angleRadius: number;
}) {
  if (isChartPointId(pointId)) {
    const point = points.find((entry) => entry.id === pointId);
    const layout = layouts.get(pointId);
    return point && layout ? { x: layout.x, y: layout.y } : null;
  }

  return pointAtRadius(angleRadius, angleLongitude(chart, pointId), ascendant);
}

function radiusInsideChart(desiredRadius: number, angle: number) {
  const radialX = Math.cos(angle);
  const radialY = Math.sin(angle);
  const maxX = radialX > 0
    ? (CHART_SIZE - PLANET_EDGE_MARGIN - CENTER) / radialX
    : radialX < 0
      ? (PLANET_EDGE_MARGIN - CENTER) / radialX
      : Number.POSITIVE_INFINITY;
  const maxY = radialY > 0
    ? (CHART_SIZE - PLANET_EDGE_MARGIN - CENTER) / radialY
    : radialY < 0
      ? (PLANET_EDGE_MARGIN - CENTER) / radialY
      : Number.POSITIVE_INFINITY;

  return Math.min(desiredRadius, maxX, maxY);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function describeRingSegment(startLongitude: number, endLongitude: number, innerR: number, outerR: number, ascendant: number) {
  const startOuter = pointAtRadius(outerR, startLongitude, ascendant);
  const endOuter = pointAtRadius(outerR, endLongitude, ascendant);
  const startInner = pointAtRadius(innerR, startLongitude, ascendant);
  const endInner = pointAtRadius(innerR, endLongitude, ascendant);
  const sweep = normalizeLongitude(endLongitude - startLongitude);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function midpointLongitude(start: number, end: number) {
  return normalizeLongitude(start + normalizeLongitude(end - start) / 2);
}

function circularDistance(left: number, right: number) {
  const diff = Math.abs(normalizeLongitude(left) - normalizeLongitude(right));
  return Math.min(diff, 360 - diff);
}

function constrainLongitudeToHouse(longitude: number, houseNumber: number, houses: HouseCusp[], paddingDegrees = 2) {
  const index = houses.findIndex((entry) => entry.house === houseNumber);
  if (index < 0) return normalizeLongitude(longitude);

  const current = houses[index]!;
  const next = houses[(index + 1) % houses.length] ?? houses[0]!;
  const start = normalizeLongitude(current.longitude);
  const span = normalizeLongitude(next.longitude - current.longitude) || 360;
  const offset = normalizeLongitude(longitude - start);

  if (span <= paddingDegrees * 2) {
    return normalizeLongitude(start + span / 2);
  }

  const clampedOffset = Math.min(Math.max(offset, paddingDegrees), span - paddingDegrees);
  return normalizeLongitude(start + clampedOffset);
}

function houseSpan(houseNumber: number, houses: HouseCusp[], paddingDegrees = 2) {
  const index = houses.findIndex((entry) => entry.house === houseNumber);
  if (index < 0) return null;

  const current = houses[index]!;
  const next = houses[(index + 1) % houses.length] ?? houses[0]!;
  const start = normalizeLongitude(current.longitude);
  const span = normalizeLongitude(next.longitude - current.longitude) || 360;
  const min = start + Math.min(paddingDegrees, span / 2);
  const max = start + Math.max(span - paddingDegrees, span / 2);

  return { start, span, min, max };
}

function unwrapLongitudeFromStart(longitude: number, start: number) {
  const normalized = normalizeLongitude(longitude);
  return normalized < start ? normalized + 360 : normalized;
}

function clampedLongitude(longitude: number, min: number, max: number) {
  return normalizeLongitude(Math.min(Math.max(longitude, min), max));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function visiblePoints(chart: NatalChartData) {
  return getAugmentedChartPoints(chart).filter((point) => DRAWABLE_IDS.has(point.id));
}

function filterPoints(points: ChartPoint[], pointIds?: ChartPointId[]) {
  if (!pointIds) return points;
  const visibleIds = new Set(pointIds);
  return points.filter((point) => visibleIds.has(point.id));
}

function degreeLabel(point: ChartPoint) {
  return `${point.degreeInSign}\u00b0${String(point.minutesInSign).padStart(2, "0")}'`;
}

function pointSignGlyph(point: ChartPoint) {
  return zodiacSigns.find((sign) => sign.id === point.sign)?.glyph ?? "";
}

function aspectStroke(type: string) {
  if (type === "trine") return "rgba(86,178,255,0.95)";
  if (type === "sextile") return "rgba(84,245,220,0.88)";
  if (type === "square") return "rgba(255,88,146,0.9)";
  if (type === "opposition") return "rgba(255,166,74,0.9)";
  if (type === "quincunx") return "rgba(190,150,255,0.78)";
  return "rgba(255,219,110,0.94)";
}

function planetLayouts({
  points,
  ascendant,
  defaultRadius,
  defaultConnectorStartRadius,
  defaultConnectorEndRadius,
  clusterStartRadius,
  clusterGlyphRadius,
  clusterThresholdDegrees = CLUSTER_THRESHOLD_DEGREES,
  conflictDegrees = CONFLICT_DEGREES,
  clusterFanStep,
  clusterRadialStep = 0,
  constrainToHouses,
  housePaddingDegrees = 2,
  isInner = false,
}: {
  points: ChartPoint[];
  ascendant: number;
  defaultRadius: number;
  defaultConnectorStartRadius: number;
  defaultConnectorEndRadius?: number;
  clusterStartRadius: number;
  clusterGlyphRadius: number;
  clusterThresholdDegrees?: number;
  conflictDegrees?: number;
  clusterFanStep?: number;
  clusterRadialStep?: number;
  constrainToHouses?: HouseCusp[];
  housePaddingDegrees?: number;
  isInner?: boolean;
}) {
  const clusters: ChartPoint[][] = [];
  const sortedPoints = [...points].sort((left, right) => left.longitude - right.longitude);
  let currentCluster: ChartPoint[] = [];

  for (const point of sortedPoints) {
    const previous = currentCluster[currentCluster.length - 1];

    if (!previous || circularDistance(previous.longitude, point.longitude) <= clusterThresholdDegrees) {
      currentCluster.push(point);
      continue;
    }

    clusters.push(currentCluster);
    currentCluster = [point];
  }

  if (currentCluster.length) {
    const firstCluster = clusters[0]?.[0];
    const lastCluster = currentCluster[currentCluster.length - 1];

    if (clusters.length > 0 && firstCluster && lastCluster && circularDistance(firstCluster.longitude, lastCluster.longitude) <= clusterThresholdDegrees) {
      clusters[0] = [...currentCluster, ...clusters[0]];
    } else {
      clusters.push(currentCluster);
    }
  }

  const layouts = new Map<ChartPointId, {
    x: number;
    y: number;
    labelX: number;
    labelY: number;
    labelAnchor: "start" | "end" | "middle";
    connectorStart: { x: number; y: number };
    connectorEnd: { x: number; y: number };
    activeConnectorStart: { x: number; y: number };
    activeConnectorEnd: { x: number; y: number };
    hasConnector: boolean;
    isClustered: boolean;
    clusterPointIds: ChartPointId[];
  }>();

  clusters.forEach((cluster) => {
    const sortedCluster = [...cluster].sort((left, right) => left.longitude - right.longitude);

    const conflictGroups: ChartPoint[][] = [];
    let subGroup: ChartPoint[] = [sortedCluster[0]];
    for (let i = 1; i < sortedCluster.length; i++) {
      if (circularDistance(sortedCluster[i - 1].longitude, sortedCluster[i].longitude) < conflictDegrees) {
        subGroup.push(sortedCluster[i]);
      } else {
        conflictGroups.push(subGroup);
        subGroup = [sortedCluster[i]];
      }
    }
    conflictGroups.push(subGroup);

    conflictGroups.forEach((conflictGroup) => {
      const clusterPointIds = conflictGroup.map((point) => point.id);
      const isClustered = conflictGroup.length > 1;
      const firstLng = conflictGroup[0].longitude;
      const adjustedLngs = conflictGroup.map((p) => {
        let lng = p.longitude;
        while (lng - firstLng > 180) lng -= 360;
        while (firstLng - lng > 180) lng += 360;
        return lng;
      });
      const centerLongitude = ((adjustedLngs.reduce((a, b) => a + b, 0) / conflictGroup.length) + 360) % 360;
      const centerIndex = (conflictGroup.length - 1) / 2;
      const visualFanStep = clusterFanStep ?? (isInner ? 10 : 13);
      const fanLongitudes = new Map<ChartPointId, number>();

      if (constrainToHouses && isClustered) {
        const houseGroups = new Map<number, Array<{ point: ChartPoint; rawLongitude: number }>>();

        conflictGroup.forEach((point, index) => {
          const visualHouse = getHouseForLongitude(point.longitude, constrainToHouses);
          const rawLongitude = centerLongitude + (index - centerIndex) * visualFanStep;
          const entries = houseGroups.get(visualHouse) ?? [];
          entries.push({ point, rawLongitude });
          houseGroups.set(visualHouse, entries);
        });

        houseGroups.forEach((entries, houseNumber) => {
          const span = houseSpan(houseNumber, constrainToHouses, housePaddingDegrees);

          if (!span) {
            entries.forEach(({ point, rawLongitude }) => {
              fanLongitudes.set(point.id, normalizeLongitude(rawLongitude));
            });
            return;
          }

          const orderedEntries = entries
            .map((entry) => ({
              ...entry,
              unwrappedLongitude: unwrapLongitudeFromStart(entry.rawLongitude, span.start),
            }))
            .sort((left, right) => left.unwrappedLongitude - right.unwrappedLongitude);

          if (orderedEntries.length === 1) {
            const entry = orderedEntries[0]!;
            fanLongitudes.set(entry.point.id, clampedLongitude(entry.unwrappedLongitude, span.min, span.max));
            return;
          }

          const available = Math.max(span.max - span.min, 0);
          const spacing = Math.min(visualFanStep, available / (orderedEntries.length - 1));
          const blockWidth = spacing * (orderedEntries.length - 1);
          const desiredCenter = orderedEntries.reduce((sum, entry) => sum + entry.unwrappedLongitude, 0) / orderedEntries.length;
          const blockCenter = Math.min(
            Math.max(desiredCenter, span.min + blockWidth / 2),
            span.max - blockWidth / 2,
          );
          const localCenterIndex = (orderedEntries.length - 1) / 2;

          orderedEntries.forEach((entry, index) => {
            fanLongitudes.set(entry.point.id, normalizeLongitude(blockCenter + (index - localCenterIndex) * spacing));
          });
        });
      }

      conflictGroup.forEach((point, index) => {
        const radialOffset = isClustered ? (index - centerIndex) * clusterRadialStep : 0;
        const rawFanLongitude = isClustered
          ? centerLongitude + (index - centerIndex) * visualFanStep
          : point.longitude;
        const visualHouse = constrainToHouses ? getHouseForLongitude(point.longitude, constrainToHouses) : point.house;
        const fanLongitude = fanLongitudes.get(point.id) ?? (
          constrainToHouses
            ? constrainLongitudeToHouse(rawFanLongitude, visualHouse, constrainToHouses, housePaddingDegrees)
            : rawFanLongitude
        );
        const angle = (pointAngle(fanLongitude, ascendant) * Math.PI) / 180;
        const desiredRadius = (isClustered ? clusterGlyphRadius : defaultRadius) + radialOffset;
        const position = pointAtRadius(radiusInsideChart(desiredRadius, angle), fanLongitude, ascendant);

        const x = position.x;
        const y = position.y;
        const connectorStart = pointAtRadius(isClustered && !isInner ? clusterStartRadius : defaultConnectorStartRadius, point.longitude, ascendant);
        const connectorEnd = isClustered && !isInner
          ? { x, y }
          : pointAtRadius(defaultConnectorEndRadius ?? defaultRadius, point.longitude, ascendant);
        const activeConnectorStart = pointAtRadius(isClustered && !isInner ? clusterStartRadius : defaultConnectorStartRadius, point.longitude, ascendant);
        const activeConnectorEnd = isClustered && !isInner
          ? { x, y }
          : pointAtRadius(defaultConnectorEndRadius ?? defaultRadius, point.longitude, ascendant);

        layouts.set(point.id, {
          x,
          y,
          labelX: x,
          labelY: y + 18,
          labelAnchor: "middle",
          connectorStart,
          connectorEnd,
          activeConnectorStart,
          activeConnectorEnd,
          hasConnector: false,
          isClustered,
          clusterPointIds,
        });
      });
    });
  });

  return layouts;
}

function DegreeTickRing({ ascendant, points }: { ascendant: number; points: ChartPoint[] }) {
  void ascendant;
  void points;
  return null;
}

function AxisLines({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  const axes = [
    { longitude: chart.meta.ascendant, opposite: chart.meta.descendant, weight: 1.8, start: "AC", end: "DC" },
    { longitude: chart.meta.mc, opposite: chart.meta.ic, weight: 1.1, start: "MC", end: "IC" },
  ];

  return (
    <>
      {axes.map((axis) => {
        const start = pointAtRadius(ZODIAC_OUTER_R + 2, axis.longitude, ascendant);
        const end = pointAtRadius(ZODIAC_OUTER_R + 2, axis.opposite, ascendant);
        const startLabel = pointAtRadius(ZODIAC_OUTER_R - 12, axis.longitude, ascendant);
        const endLabel = pointAtRadius(ZODIAC_OUTER_R - 12, axis.opposite, ascendant);

        return (
          <g key={axis.start}>
            <line x1={round(start.x)} y1={round(start.y)} x2={round(end.x)} y2={round(end.y)} stroke="rgba(6,19,49,0.74)" strokeWidth={axis.weight} />
            {[
              { label: axis.start, point: startLabel },
              { label: axis.end, point: endLabel },
            ].map(({ label, point }) => (
              <g key={label}>
                <rect x={round(point.x) - 20} y={round(point.y) - 11} width="40" height="22" rx="11" fill="#fffdf8" stroke="rgba(0,102,255,0.28)" strokeWidth="1" filter="url(#bw-glow)" />
                <text
                  x={round(point.x)}
                  y={round(point.y)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#061331"
                  fontFamily="'Spectral', serif"
                  fontSize="14"
                  fontWeight="700"
                  letterSpacing="0.04em"
                >
                  {label}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </>
  );
}

function HouseGeometry({
  chart,
  ascendant,
  lineOuterRadius = PLANET_GROUP_DIVIDER_R,
}: {
  chart: NatalChartData;
  ascendant: number;
  lineOuterRadius?: number;
}) {
  const houseTones = {
    angular: "rgba(209,118,118,0.05)",
    succedent: "rgba(216,194,122,0.035)",
    cadent: "rgba(140,158,240,0.03)",
  } as const;

  return (
    <>
      {chart.houses.map((house, index) => {
        const current = house.longitude;
        const next = chart.houses[(index + 1) % 12]!.longitude;
        const span = (next - current + 360) % 360;
        const end = current + (span === 0 ? 360 : span);
        const tone =
          house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10
            ? houseTones.angular
            : house.house === 2 || house.house === 5 || house.house === 8 || house.house === 11
              ? houseTones.succedent
              : houseTones.cadent;

        return (
          <path
            key={`house-zone-${house.house}`}
            d={describeRingSegment(current, end, HOUSE_INNER_R, HOUSE_OUTER_R, ascendant)}
            fill={tone}
            stroke="none"
          />
        );
      })}

      {chart.houses.map((house) => {
        const lineStart = pointAtRadius(lineOuterRadius, house.longitude, ascendant);
        const lineEnd = pointAtRadius(HOUSE_INNER_R, house.longitude, ascendant);
        return (
          <line
            key={`house-line-${house.house}`}
            x1={round(lineStart.x)}
            y1={round(lineStart.y)}
            x2={round(lineEnd.x)}
            y2={round(lineEnd.y)}
            stroke={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "rgba(5,7,12,0.68)" : "rgba(5,7,12,0.48)"}
            strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "1.8" : "1.15"}
          />
        );
      })}

      <circle cx={CENTER} cy={CENTER} r={HOUSE_NUMBER_R} fill="none" stroke="rgba(5,7,12,0.36)" strokeWidth="0.85" />

      {chart.houses.map((house, index) => {
        const nextHouse = chart.houses[(index + 1) % chart.houses.length] ?? chart.houses[0]!;
        const label = pointAtRadius(HOUSE_NUMBER_LABEL_R, midpointLongitude(house.longitude, nextHouse.longitude), ascendant);
        return (
          <g key={`house-label-${house.house}`}>
            <text
              x={round(label.x)}
              y={round(label.y)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#05070c"
              fontFamily="'Inter', sans-serif"
              fontSize="11"
              fontWeight="900"
              letterSpacing="0"
              stroke="rgba(255,253,248,0.95)"
              strokeWidth="1.8"
              paintOrder="stroke fill"
            >
              {house.house}
            </text>
          </g>
        );
      })}
    </>
  );
}

function SolarReturnAngleMarkers({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  const angles = [
    { key: "rs-asc", longitude: chart.meta.ascendant, label: "ASC RS" },
    { key: "rs-mc", longitude: chart.meta.mc, label: "MC RS" },
  ];

  return (
    <g>
      {angles.map((angle) => {
        const lineStart = pointAtRadius(OUTER_SEP_R + 4, angle.longitude, ascendant);
        const lineEnd = pointAtRadius(OUTER_LABEL_R + 4, angle.longitude, ascendant);
        const label = pointAtRadius(OUTER_LABEL_R + 22, angle.longitude, ascendant);

        return (
          <g key={angle.key}>
            <line
              x1={lineStart.x}
              y1={lineStart.y}
              x2={lineEnd.x}
              y2={lineEnd.y}
              stroke="rgba(95,75,31,0.72)"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
            <rect
              x={label.x - 22}
              y={label.y - 10}
              width="44"
              height="20"
              rx="10"
              fill="#fffaf0"
              stroke="rgba(143,123,69,0.48)"
              strokeWidth="0.9"
              filter="url(#bw-glow)"
            />
            <text
              x={label.x}
              y={label.y + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-semibold"
              fill="#5f4b1f"
            >
              {angle.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SolarReturnHouseLabels({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  return (
    <g pointerEvents="none">
      {chart.houses.map((house, index) => {
        const nextHouse = chart.houses[(index + 1) % chart.houses.length] ?? chart.houses[0]!;
        const current = house.longitude;
        const next = nextHouse.longitude;
        const span = (next - current + 360) % 360;
        const end = current + (span === 0 ? 360 : span);
        const label = pointAtRadius(SOLAR_HOUSE_NUMBER_R, midpointLongitude(current, next), ascendant);
        const lineStart = pointAtRadius(SOLAR_HOUSE_RING_INNER_R, current, ascendant);
        const lineEnd = pointAtRadius(SOLAR_HOUSE_RING_OUTER_R, current, ascendant);

        return (
          <g key={`rs-house-label-${house.house}`}>
            <path
              d={describeRingSegment(current, end, SOLAR_HOUSE_RING_INNER_R, SOLAR_HOUSE_RING_OUTER_R, ascendant)}
              fill={house.house % 2 === 0 ? "rgba(255,253,248,0.24)" : "rgba(245,215,130,0.16)"}
              stroke="none"
            />
            <line
              x1={round(lineStart.x)}
              y1={round(lineStart.y)}
              x2={round(lineEnd.x)}
              y2={round(lineEnd.y)}
              stroke={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "rgba(5,7,12,0.62)" : "rgba(95,75,31,0.68)"}
              strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "1.6" : "1.15"}
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
            <text
              x={label.x}
              y={label.y + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[9px] font-black"
              fill="#05070c"
              stroke="rgba(255,253,248,0.92)"
              strokeWidth="2"
              paintOrder="stroke fill"
            >
              {house.house}
            </text>
          </g>
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={SOLAR_HOUSE_RING_OUTER_R} fill="none" stroke="rgba(5,7,12,0.42)" strokeWidth="1.15" strokeDasharray="3 5" />
    </g>
  );
}

export function BiWheelChart({
  innerChart,
  outerChart,
  innerLabel = innerChart.event.name,
  outerLabel = outerChart?.event.name,
  variant = "solar-return",
  context,
  innerPointIds,
  outerPointIds,
  interAspects = [],
  showOuterAspects = false,
  showInterAspects = false,
  selectedInnerPointId,
  selectedOuterPointId,
  onInnerPlanetSelect,
  onOuterPlanetSelect,
}: BiWheelChartProps) {
  const locale = useStoredLocale();
  const explainerContext = context ?? variant;
  const colors = VARIANTS[variant];
  const [uncontrolledSelectedInner, setUncontrolledSelectedInner] = useState<ChartPointId | null>(null);
  const [uncontrolledSelectedOuter, setUncontrolledSelectedOuter] = useState<ChartPointId | null>(null);
  const [hoveredPointTag, setHoveredPointTag] = useState<HoveredPointTag | null>(null);
  const innerPoints = useMemo(() => filterPoints(visiblePoints(innerChart), innerPointIds), [innerChart, innerPointIds]);
  const outerPoints = useMemo(() => outerChart ? filterPoints(visiblePoints(outerChart), outerPointIds) : [], [outerChart, outerPointIds]);
  const ascendant = innerChart.meta.ascendant;
  const innerLayouts = useMemo(() => planetLayouts({
    points: innerPoints,
    ascendant,
    defaultRadius: INNER_PLANET_LABEL_R,
    defaultConnectorStartRadius: INNER_PLANET_LABEL_R,
    defaultConnectorEndRadius: INNER_PLANET_LABEL_R,
    clusterStartRadius: ZODIAC_INNER_R,
    clusterGlyphRadius: INNER_PLANET_LABEL_R,
    clusterThresholdDegrees: 11,
    conflictDegrees: 11,
    clusterFanStep: 6.5,
    constrainToHouses: undefined,
    housePaddingDegrees: 2,
    isInner: true,
  }), [ascendant, innerChart.houses, innerPoints]);
  const outerLayouts = useMemo(() => planetLayouts({
    points: outerPoints,
    ascendant,
    defaultRadius: OUTER_PLANET_R,
    defaultConnectorStartRadius: OUTER_SEP_R + 3,
    defaultConnectorEndRadius: OUTER_PLANET_R,
    clusterStartRadius: ZODIAC_OUTER_R,
    clusterGlyphRadius: OUTER_PLANET_R,
    clusterThresholdDegrees: 11,
    conflictDegrees: 11,
    clusterFanStep: 5,
    clusterRadialStep: 0,
    constrainToHouses: variant === "solar-return" ? outerChart?.houses : undefined,
    housePaddingDegrees: 2,
  }), [ascendant, outerChart?.houses, outerPoints, variant]);
  const selectedInner = selectedInnerPointId !== undefined ? selectedInnerPointId : uncontrolledSelectedInner;
  const selectedOuter = selectedOuterPointId !== undefined ? selectedOuterPointId : uncontrolledSelectedOuter;
  const activeInner = selectedInner;
  const activeOuter = selectedOuter;
  const hasAspectFocus = Boolean(activeInner || activeOuter);
  const focusedInnerPointIds = new Set<ChartPointId>();
  const focusedOuterPointIds = new Set<ChartPointId>();
  if (activeInner) {
    focusedInnerPointIds.add(activeInner);
    innerChart.aspects.forEach((aspect) => {
      if (aspect.from === activeInner && isChartPointId(aspect.to)) focusedInnerPointIds.add(aspect.to);
      if (aspect.to === activeInner && isChartPointId(aspect.from)) focusedInnerPointIds.add(aspect.from);
    });
    interAspects.forEach((aspect) => {
      if (aspect.pointA === activeInner && isChartPointId(aspect.pointB)) focusedOuterPointIds.add(aspect.pointB);
    });
  }
  if (activeOuter) {
    focusedOuterPointIds.add(activeOuter);
    outerChart?.aspects.forEach((aspect) => {
      if (aspect.from === activeOuter && isChartPointId(aspect.to)) focusedOuterPointIds.add(aspect.to);
      if (aspect.to === activeOuter && isChartPointId(aspect.from)) focusedOuterPointIds.add(aspect.from);
    });
    interAspects.forEach((aspect) => {
      if (aspect.pointB === activeOuter && isChartPointId(aspect.pointA)) focusedInnerPointIds.add(aspect.pointA);
    });
  }
  const activePoint = activeInner
    ? innerPoints.find((point) => point.id === activeInner)
    : outerPoints.find((point) => point.id === activeOuter);
  const showWheelDetails = Boolean(outerChart);
  const showPointTag = (pointId: ChartPointId, x: number, y: number) => {
    setHoveredPointTag({
      id: pointId,
      x,
      y,
    });
  };
  const clearSelection = () => {
    setUncontrolledSelectedInner(null);
    setUncontrolledSelectedOuter(null);
    onInnerPlanetSelect?.(null);
    onOuterPlanetSelect?.(null);
  };
  const selectInnerPoint = (pointId: ChartPointId) => {
    setHoveredPointTag(null);
    if (selectedInner === pointId) {
      clearSelection();
      return;
    }

    setUncontrolledSelectedInner(pointId);
    setUncontrolledSelectedOuter(null);
    onInnerPlanetSelect?.(pointId);
  };
  const selectOuterPoint = (pointId: ChartPointId) => {
    setHoveredPointTag(null);
    if (selectedOuter === pointId) {
      clearSelection();
      return;
    }

    setUncontrolledSelectedOuter(pointId);
    setUncontrolledSelectedInner(null);
    onOuterPlanetSelect?.(pointId);
  };
  const orderedInnerPoints = [...innerPoints].sort((left, right) => {
    const leftActive = left.id === selectedInner;
    const rightActive = right.id === selectedInner;
    return Number(leftActive) - Number(rightActive);
  });
  const orderedOuterPoints = [...outerPoints].sort((left, right) => {
    const leftActive = left.id === selectedOuter;
    const rightActive = right.id === selectedOuter;
    return Number(leftActive) - Number(rightActive);
  });
  const hoveredPointLabel = hoveredPointTag ? getPointLabel(hoveredPointTag.id, locale) : "";
  const hoveredTagWidth = clampNumber(hoveredPointLabel.length * 7.4 + 28, 92, 178);
  const hoveredTagX = hoveredPointTag
    ? clampNumber(hoveredPointTag.x, hoveredTagWidth / 2 + 8, CHART_SIZE - hoveredTagWidth / 2 - 8)
    : 0;
  const hoveredTagY = hoveredPointTag
    ? clampNumber(hoveredPointTag.y - 36, 18, CHART_SIZE - 18)
    : 0;

  return (
    <div className="relative mx-auto w-[min(100%,calc(100vw-1.5rem))] max-w-[1020px] pb-20 sm:pb-24">
      {outerChart ? (
        <div className="mx-auto mb-5 max-w-3xl border border-[#f5d782]/28 bg-[#061331]/82 px-4 py-3 text-center shadow-[0_16px_42px_rgba(0,0,0,0.22)] backdrop-blur-md sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f5d782]">
            {locale === "en" ? "How to read this wheel" : locale === "it" ? "Come leggere questa ruota" : "Cómo leer esta rueda"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#fffaf0]">
            {biWheelExplainer(explainerContext, locale, innerLabel, outerLabel)}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-[11px] font-medium leading-5 text-[#d7e7ff]/78">
            {biWheelAccuracyNote(locale)}
          </p>
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="relative mb-16 h-auto w-full overflow-visible sm:mb-20"
        role="img"
        aria-label={outerChart ? `${innerLabel} / ${outerLabel}` : innerLabel}
      >
        <defs>
          <radialGradient id="bw-field-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(216,194,122,0.08)" />
            <stop offset="58%" stopColor="rgba(216,194,122,0.025)" />
            <stop offset="100%" stopColor="rgba(30,26,46,0.02)" />
          </radialGradient>
          <radialGradient id="bw-surface-bg" cx="50%" cy="45%" r="56%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="52%" stopColor="#f4f7ff" />
            <stop offset="100%" stopColor="#dce8f8" />
          </radialGradient>
          <filter id="bw-soft-halo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bw-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-hover-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-outer-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-aspect-neon" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R + 10} fill="url(#bw-surface-bg)" stroke="rgba(124,191,255,0.26)" strokeWidth="1.4" filter="url(#bw-glow)" />
        <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R - 4} fill="none" stroke="rgba(245,215,130,0.15)" strokeWidth="10" />
        <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R + 18} fill="url(#bw-field-glow)" />
        <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R - 10} fill="none" stroke="rgba(30,26,46,0.06)" strokeWidth="16" filter="url(#bw-soft-halo)" />
        {outerChart ? <circle cx={CENTER} cy={CENTER} r={OUTER_PLANET_R} fill="none" stroke="rgba(143,123,69,0.09)" strokeWidth="16" filter="url(#bw-soft-halo)" /> : null}

        <g>
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R} fill="url(#bw-field-glow)" />
          {zodiacSigns.map((sign) => {
            const label = pointAtRadius((ZODIAC_OUTER_R + ZODIAC_INNER_R) / 2, midpointLongitude(sign.start, sign.start + 30), ascendant);

            return (
              <g key={sign.id}>
                <path
                  d={describeRingSegment(sign.start, sign.start + 30, ZODIAC_INNER_R, ZODIAC_OUTER_R, ascendant)}
                  fill={ELEMENT_TINTS[sign.element]}
                  stroke="rgba(8,42,120,0.16)"
                  strokeWidth="1"
                />
                <text
                  x={label.x}
                  y={label.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#061331"
                  fillOpacity="0.92"
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize="32"
                  fontWeight="700"
                  stroke="rgba(255,253,248,0.86)"
                  strokeWidth="1.15"
                  paintOrder="stroke fill"
                  style={{ filter: "drop-shadow(0 0 6px rgba(124,191,255,0.18))" }}
                >
                  {sign.glyph}
                </text>
              </g>
            );
          })}
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R + 2} fill="none" stroke="rgba(0,102,255,0.26)" strokeWidth="1.3" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R - 12} fill="none" stroke="rgba(245,215,130,0.24)" strokeWidth="0.8" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R + 12} fill="none" stroke="rgba(124,191,255,0.18)" strokeWidth="0.8" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R} fill="none" stroke="rgba(5,7,12,0.5)" strokeWidth="1.35" />
          {outerChart ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={PLANET_GROUP_DIVIDER_R}
              fill="none"
              stroke="rgba(8,42,120,0.16)"
              strokeWidth="2.2"
            />
          ) : null}
          <circle cx={CENTER} cy={CENTER} r={HOUSE_INNER_R} fill="none" stroke="rgba(5,7,12,0.32)" strokeWidth="0.9" />
          <DegreeTickRing ascendant={ascendant} points={innerPoints} />
          <AxisLines chart={innerChart} ascendant={ascendant} />
          {innerChart.aspects.slice(0, 32).map((aspect) => {
            if (!isChartPointId(aspect.from) || !isChartPointId(aspect.to)) return null;
            const from = innerPoints.find((point) => point.id === aspect.from);
            const to = innerPoints.find((point) => point.id === aspect.to);
            if (!from || !to) return null;
            const focused = activeInner ? aspect.from === activeInner || aspect.to === activeInner : !hasAspectFocus;
            if (hasAspectFocus && !focused) return null;
            const opacity = hasAspectFocus ? (focused ? 0.82 : 0.07) : 0.28;
            const start = pointAtRadius(138, from.longitude, ascendant);
            const end = pointAtRadius(138, to.longitude, ascendant);
            return (
              <line
                key={aspect.id}
                className="sarita-aspect-draw"
                pathLength={1}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={aspectStroke(aspect.type)}
                strokeWidth={focused ? "1.45" : "0.65"}
                strokeOpacity={opacity}
                filter={focused ? "url(#bw-aspect-neon)" : undefined}
              />
            );
          })}
          {showOuterAspects ? outerChart?.aspects.slice(0, 32).map((aspect) => {
            if (!isChartPointId(aspect.from) || !isChartPointId(aspect.to)) return null;
            const from = outerPoints.find((point) => point.id === aspect.from);
            const to = outerPoints.find((point) => point.id === aspect.to);
            const fromLayout = outerLayouts.get(aspect.from);
            const toLayout = outerLayouts.get(aspect.to);
            if (!from || !to || !fromLayout || !toLayout) return null;
            const focused = activeOuter ? aspect.from === activeOuter || aspect.to === activeOuter : !hasAspectFocus;
            if (hasAspectFocus && !focused) return null;
            const opacity = hasAspectFocus ? (focused ? 0.9 : 0.06) : 0.26;
            const start = { x: fromLayout.x, y: fromLayout.y };
            const end = { x: toLayout.x, y: toLayout.y };
            return (
              <line
                key={`outer-${aspect.id}`}
                className="sarita-aspect-draw"
                pathLength={1}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={aspectStroke(aspect.type)}
                strokeWidth={focused ? "1.55" : "0.7"}
                strokeOpacity={opacity}
                filter={focused ? "url(#bw-aspect-neon)" : undefined}
              />
            );
          }) : null}
          <HouseGeometry
            chart={innerChart}
            ascendant={ascendant}
            lineOuterRadius={outerChart && variant !== "solar-return" ? ZODIAC_INNER_R : PLANET_GROUP_DIVIDER_R}
          />
          {outerChart && variant === "solar-return" ? <SolarReturnHouseLabels chart={outerChart} ascendant={ascendant} /> : null}
          <circle cx={CENTER} cy={CENTER} r="5" fill="rgba(30,26,46,0.62)" filter="url(#bw-glow)" />
          {showInterAspects ? interAspects.slice(0, 36).map((aspect) => {
            const start = aspectEndpoint({
              pointId: aspect.pointA,
              chart: innerChart,
              points: innerPoints,
              layouts: innerLayouts,
              ascendant,
              angleRadius: PLANET_GROUP_DIVIDER_R,
            });
            const end = aspectEndpoint({
              pointId: aspect.pointB,
              chart: outerChart ?? innerChart,
              points: outerPoints,
              layouts: outerLayouts,
              ascendant,
              angleRadius: OUTER_PLANET_R,
            });
            if (!start || !end) return null;
            const focused = Boolean(
              (activeInner && aspect.pointA === activeInner) ||
              (activeOuter && aspect.pointB === activeOuter),
            );
            if (hasAspectFocus && !focused) return null;
            const opacity = hasAspectFocus ? (focused ? 0.98 : 0.08) : 0.42;
            return (
              <g key={`inter-${aspect.pointA}-${aspect.pointB}-${aspect.type}`}>
                {focused ? (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={aspectStroke(aspect.type)}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeOpacity="0.14"
                    filter="url(#bw-aspect-neon)"
                  />
                ) : null}
                <line
                  className="sarita-aspect-draw"
                  pathLength={1}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={aspectStroke(aspect.type)}
                  strokeWidth={focused ? "3" : "1.2"}
                  strokeLinecap="round"
                  strokeDasharray={focused ? undefined : "4 6"}
                  strokeOpacity={opacity}
                  filter={focused ? "url(#bw-aspect-neon)" : undefined}
                />
              </g>
            );
          }) : null}

          {orderedInnerPoints.map((point) => {
            const layout = innerLayouts.get(point.id);
            if (!layout) return null;
            const active = selectedInner === point.id;
            if (hasAspectFocus && !focusedInnerPointIds.has(point.id)) return null;
            const scale = selectedInner === point.id ? 1.08 : 1;
            const transform = scale !== 1 ? `translate(${layout.x} ${layout.y}) scale(${scale}) translate(${-layout.x} ${-layout.y})` : undefined;
            const radialLength = Math.hypot(layout.x - CENTER, layout.y - CENTER) || 1;
            const inwardX = (CENTER - layout.x) / radialLength;
            const inwardY = (CENTER - layout.y) / radialLength;
            const degreePosition = { x: layout.x + inwardX * 28, y: layout.y + inwardY * 28 };
            const signPosition = { x: layout.x + inwardX * 49, y: layout.y + inwardY * 49 };
            const minutePosition = { x: layout.x + inwardX * 66, y: layout.y + inwardY * 66 };
            return (
              <g
                key={point.id}
                role="button"
                tabIndex={0}
                transform={transform}
                onMouseEnter={() => showPointTag(point.id, layout.x, layout.y)}
                onMouseLeave={() => setHoveredPointTag(null)}
                onFocus={() => showPointTag(point.id, layout.x, layout.y)}
                onBlur={() => setHoveredPointTag(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  selectInnerPoint(point.id);
                }}
                opacity={1}
                className="cursor-pointer outline-none"
                style={{ outline: "none" }}
              >
                {active ? (
                  <circle
                    cx={layout.x}
                    cy={layout.y}
                    r="29"
                    fill="rgba(0,102,255,0.08)"
                    stroke="rgba(245,215,130,0.7)"
                    strokeOpacity="0.8"
                    strokeWidth="1.2"
                    filter="url(#bw-hover-glow)"
                  />
                ) : null}
                {hasAspectFocus && focusedInnerPointIds.has(point.id) && !active ? (
                  <circle
                    cx={layout.x}
                    cy={layout.y}
                    r="24"
                    fill="none"
                    stroke="rgba(124,191,255,0.46)"
                    strokeWidth="1"
                    filter="url(#bw-hover-glow)"
                  />
                ) : null}
                <text
                  x={layout.x + planetGlyphOffset(point.id).x}
                  y={layout.y + planetGlyphOffset(point.id).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={planetGlyphInk(point.id)}
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize={active ? "34" : "24"}
                  fontWeight="700"
                  stroke="#fffdf8"
                  strokeWidth={active ? "1.2" : "0.9"}
                  paintOrder="stroke fill"
                  style={{ filter: active ? "url(#bw-hover-glow)" : "url(#bw-glow)" }}
                >
                  {POINT_SYMBOLS[point.id]}
                </text>
                {showWheelDetails ? (
                  <>
                    <text
                      x={degreePosition.x}
                      y={degreePosition.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#061331"
                      fontFamily="'Inter', sans-serif"
                      fontSize="15"
                      fontWeight="800"
                      stroke="#fffdf8"
                      strokeWidth="1.7"
                      paintOrder="stroke fill"
                    >
                      {String(point.degreeInSign).padStart(2, "0")}°
                    </text>
                    <text
                      x={signPosition.x}
                      y={signPosition.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={planetGlyphInk(point.id)}
                      fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                      fontSize="11"
                      fontWeight="800"
                      stroke="#fffdf8"
                      strokeWidth="1.25"
                      paintOrder="stroke fill"
                    >
                      {pointSignGlyph(point)}
                    </text>
                    <text
                      x={minutePosition.x}
                      y={minutePosition.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#061331"
                      fontFamily="'Inter', sans-serif"
                      fontSize="8.5"
                      fontWeight="800"
                      stroke="#fffdf8"
                      strokeWidth="1.15"
                      paintOrder="stroke fill"
                    >
                      {String(point.minutesInSign).padStart(2, "0")}'
                    </text>
                  </>
                ) : null}
                {false ? (
                  <text
                    x={layout?.labelX ?? 0}
                    y={layout?.labelY ?? 0}
                    textAnchor={layout?.labelAnchor ?? "middle"}
                    dominantBaseline="central"
                    fill="#061331"
                    fontFamily="'Inter', sans-serif"
                    fontSize="10.5"
                    fontWeight="700"
                    letterSpacing="0.01em"
                    stroke="#fffdf8"
                    strokeWidth="2"
                    paintOrder="stroke fill"
                  >
                    {degreeLabel(point)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        {orderedOuterPoints.map((point) => {
          const layout = outerLayouts.get(point.id);
          if (!layout) return null;
          const active = selectedOuter === point.id;
          if (hasAspectFocus && !focusedOuterPointIds.has(point.id)) return null;
          const position = { x: layout.x, y: layout.y };
          const scale = selectedOuter === point.id ? 1.08 : 1;
          const transform = scale !== 1 ? `translate(${position.x} ${position.y}) scale(${scale}) translate(${-position.x} ${-position.y})` : undefined;
          const radialLength = Math.hypot(position.x - CENTER, position.y - CENTER) || 1;
          const inwardX = (CENTER - position.x) / radialLength;
          const inwardY = (CENTER - position.y) / radialLength;
          const degreePosition = { x: position.x + inwardX * 34, y: position.y + inwardY * 34 };
          const signPosition = { x: position.x + inwardX * 59, y: position.y + inwardY * 59 };
          const minutePosition = { x: position.x + inwardX * 78, y: position.y + inwardY * 78 };
          return (
            <g
              key={point.id}
              role="button"
              tabIndex={0}
              transform={transform}
              onMouseEnter={() => showPointTag(point.id, position.x, position.y)}
              onMouseLeave={() => setHoveredPointTag(null)}
              onFocus={() => showPointTag(point.id, position.x, position.y)}
              onBlur={() => setHoveredPointTag(null)}
              onClick={(event) => {
                event.stopPropagation();
                selectOuterPoint(point.id);
              }}
              className="cursor-pointer outline-none"
              style={{ outline: "none" }}
            >
              {active ? (
                <circle cx={position.x} cy={position.y} r="28" fill="rgba(232,197,71,0.08)" stroke={colors.primary} strokeOpacity="0.55" strokeWidth="1.1" />
              ) : null}
              {hasAspectFocus && focusedOuterPointIds.has(point.id) && !active ? (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="24"
                  fill="none"
                  stroke="rgba(124,191,255,0.46)"
                  strokeWidth="1"
                  filter="url(#bw-outer-glow)"
                />
              ) : null}
              <text
                x={position.x + planetGlyphOffset(point.id).x}
                y={position.y + planetGlyphOffset(point.id).y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={planetGlyphInk(point.id)}
                fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                fontSize={active ? "42" : "34"}
                fontWeight="700"
                stroke="#fffdf8"
                strokeWidth={active ? "1.35" : "1.1"}
                paintOrder="stroke fill"
                style={{ filter: active ? "url(#bw-outer-glow)" : "url(#bw-glow)" }}
              >
                {POINT_SYMBOLS[point.id]}
              </text>
              {showWheelDetails ? (
                <>
                  <text
                    x={degreePosition.x}
                    y={degreePosition.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#061331"
                    fontFamily="'Inter', sans-serif"
                    fontSize="18"
                    fontWeight="800"
                    stroke="#fffdf8"
                    strokeWidth="2"
                    paintOrder="stroke fill"
                  >
                    {String(point.degreeInSign).padStart(2, "0")}°
                  </text>
                  <text
                    x={signPosition.x}
                    y={signPosition.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={planetGlyphInk(point.id)}
                    fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                    fontSize="13"
                    fontWeight="800"
                    stroke="#fffdf8"
                    strokeWidth="1.5"
                    paintOrder="stroke fill"
                  >
                    {pointSignGlyph(point)}
                  </text>
                  <text
                    x={minutePosition.x}
                    y={minutePosition.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#061331"
                    fontFamily="'Inter', sans-serif"
                    fontSize="10"
                    fontWeight="800"
                    stroke="#fffdf8"
                    strokeWidth="1.35"
                    paintOrder="stroke fill"
                  >
                    {String(point.minutesInSign).padStart(2, "0")}'
                  </text>
                </>
              ) : null}
              {false ? (
                <text
                  x={layout?.labelX ?? 0}
                  y={layout?.labelY ?? 0}
                  textAnchor={layout?.labelAnchor ?? "middle"}
                  dominantBaseline="central"
                  fill="#061331"
                  fontFamily="'Inter', sans-serif"
                  fontSize="10.5"
                  fontWeight="700"
                  letterSpacing="0.01em"
                  stroke="#fffdf8"
                  strokeWidth="2"
                  paintOrder="stroke fill"
                >
                  {degreeLabel(point)}
                </text>
              ) : null}
            </g>
          );
        })}

        {outerChart && variant === "solar-return" ? <SolarReturnAngleMarkers chart={outerChart} ascendant={ascendant} /> : null}

        {hoveredPointTag && !activePoint ? (
          <g pointerEvents="none" transform={`translate(${round(hoveredTagX)} ${round(hoveredTagY)})`}>
            <rect
              x={round(-hoveredTagWidth / 2)}
              y="-15"
              width={round(hoveredTagWidth)}
              height="30"
              rx="15"
              fill="#061331"
              stroke="rgba(215,231,255,0.16)"
              strokeWidth="0.8"
              filter="url(#bw-glow)"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fffaf0"
              fontFamily="'Inter', sans-serif"
              fontSize="12"
              fontWeight="700"
            >
              {hoveredPointLabel}
            </text>
          </g>
        ) : null}

      </svg>

      {activePoint ? (
        <div className="pointer-events-none mx-auto mt-5 flex w-fit max-w-[min(24rem,88vw)] items-center justify-center gap-2 rounded-full border border-[#f5d782]/35 bg-[#061331]/75 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#fffaf0] shadow-[0_16px_42px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <span className="font-serif text-base leading-none text-[#f5d782]">{POINT_SYMBOLS[activePoint.id]}</span>
          <span>{degreeLabel(activePoint)}</span>
        </div>
      ) : null}

      <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
        <span className="notranslate inline-flex max-w-[min(22rem,86vw)] items-center justify-center gap-2 rounded-full border border-[#d7e7ff]/16 bg-[#061331]/60 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md [overflow-wrap:normal] [word-break:normal]" translate="no">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fffaf0]" />
          {innerLabel}
        </span>
        {outerChart ? (
          <span className="notranslate inline-flex max-w-[min(22rem,86vw)] items-center justify-center gap-2 rounded-full border border-[#d7e7ff]/16 bg-[#061331]/60 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md [overflow-wrap:normal] [word-break:normal]" translate="no">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
            {outerLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
