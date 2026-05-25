"use client";

import { useMemo, useState } from "react";

import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import { getAugmentedChartPoints, normalizeLongitude, zodiacSigns } from "@/lib/chart";
import type { SynastryAspect } from "@/lib/synastry";

export type BiWheelVariant = "solar-return" | "synastry";

type BiWheelChartProps = {
  innerChart: NatalChartData;
  outerChart?: NatalChartData;
  innerLabel?: string;
  outerLabel?: string;
  variant?: BiWheelVariant;
  innerPointIds?: ChartPointId[];
  outerPointIds?: ChartPointId[];
  interAspects?: SynastryAspect[];
  showOuterAspects?: boolean;
  showInterAspects?: boolean;
  selectedInnerPointId?: ChartPointId | null;
  selectedOuterPointId?: ChartPointId | null;
  onInnerPlanetSelect?: (pointId: ChartPointId) => void;
  onOuterPlanetSelect?: (pointId: ChartPointId) => void;
};

const CENTER = 430;
const ZODIAC_OUTER_R = 402;
const ZODIAC_INNER_R = 344;
const INNER_PLANET_LABEL_R = 320;
const OUTER_SEP_R = 343;
const OUTER_PLANET_R = 414;
const OUTER_LABEL_R = 432;
const CLUSTER_THRESHOLD_DEGREES = 8;
const CLUSTER_FAN_STEP = 14;
const INNER_CLUSTER_CALLOUT_R = ZODIAC_OUTER_R + 30;
const OUTER_CLUSTER_CALLOUT_R = ZODIAC_OUTER_R + 34;
const HOUSE_OUTER_R = 252;
const HOUSE_INNER_R = 142;
const HOUSE_NUMBER_R = 208;
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
  partOfFortune: { x: 0, y: 1.4 },
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

function radiusInsideChart(desiredRadius: number, angle: number) {
  const radialX = Math.cos(angle);
  const radialY = Math.sin(angle);
  const maxX = radialX > 0
    ? (860 - PLANET_EDGE_MARGIN - CENTER) / radialX
    : radialX < 0
      ? (PLANET_EDGE_MARGIN - CENTER) / radialX
      : Number.POSITIVE_INFINITY;
  const maxY = radialY > 0
    ? (860 - PLANET_EDGE_MARGIN - CENTER) / radialY
    : radialY < 0
      ? (PLANET_EDGE_MARGIN - CENTER) / radialY
      : Number.POSITIVE_INFINITY;

  return Math.min(desiredRadius, maxX, maxY);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function lineBetween(innerRadius: number, outerRadius: number, longitude: number, ascendant: number) {
  return {
    inner: pointAtRadius(innerRadius, longitude, ascendant),
    outer: pointAtRadius(outerRadius, longitude, ascendant),
  };
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
  isInner = false,
}: {
  points: ChartPoint[];
  ascendant: number;
  defaultRadius: number;
  defaultConnectorStartRadius: number;
  defaultConnectorEndRadius?: number;
  clusterStartRadius: number;
  clusterGlyphRadius: number;
  isInner?: boolean;
}) {
  const clusters: ChartPoint[][] = [];
  const sortedPoints = [...points].sort((left, right) => left.longitude - right.longitude);
  let currentCluster: ChartPoint[] = [];

  for (const point of sortedPoints) {
    const previous = currentCluster[currentCluster.length - 1];

    if (!previous || circularDistance(previous.longitude, point.longitude) <= CLUSTER_THRESHOLD_DEGREES) {
      currentCluster.push(point);
      continue;
    }

    clusters.push(currentCluster);
    currentCluster = [point];
  }

  if (currentCluster.length) {
    const firstCluster = clusters[0]?.[0];
    const lastCluster = currentCluster[currentCluster.length - 1];

    if (clusters.length > 0 && firstCluster && lastCluster && circularDistance(firstCluster.longitude, lastCluster.longitude) <= CLUSTER_THRESHOLD_DEGREES) {
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
    labelAnchor: "start" | "end";
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
    const clusterPointIds = sortedCluster.map((point) => point.id);
    const firstLng = sortedCluster[0].longitude;
    const adjustedLngs = sortedCluster.map((p) => {
      let lng = p.longitude;
      while (lng - firstLng > 180) lng -= 360;
      while (firstLng - lng > 180) lng += 360;
      return lng;
    });
    const centerLongitude = ((adjustedLngs.reduce((a, b) => a + b, 0) / sortedCluster.length) + 360) % 360;

    sortedCluster.forEach((point, index) => {
      const isClustered = sortedCluster.length > 1;
      const fanLongitude = isClustered
        ? centerLongitude + (index - (sortedCluster.length - 1) / 2) * CLUSTER_FAN_STEP
        : point.longitude;
      const angle = (pointAngle(fanLongitude, ascendant) * Math.PI) / 180;
      const radialX = Math.cos(angle);
      const desiredRadius = isClustered && !isInner ? clusterGlyphRadius : defaultRadius;
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
      const labelSide = radialX >= 0 ? 1 : -1;

      layouts.set(point.id, {
        x,
        y,
        labelX: x + labelSide * 28,
        labelY: y + 10,
        labelAnchor: labelSide > 0 ? "start" : "end",
        connectorStart,
        connectorEnd,
        activeConnectorStart,
        activeConnectorEnd,
        hasConnector: isClustered && !isInner,
        isClustered,
        clusterPointIds,
      });
    });
  });

  return layouts;
}

function DegreeTickRing({ ascendant, points }: { ascendant: number; points: ChartPoint[] }) {
  const ticks = [];
  const labels = [];

  for (const sign of zodiacSigns) {
    for (let degree = 0; degree < 30; degree += 1) {
      const longitude = sign.start + degree;
      const isFifteen = degree === 15;
      const isLabelDegree = degree === 0 || isFifteen;
      const isFive = degree % 5 === 0 && !isLabelDegree;
      const radii = lineBetween(
        isLabelDegree ? ZODIAC_INNER_R - 16 : isFive ? ZODIAC_INNER_R - 10 : ZODIAC_INNER_R - 6,
        ZODIAC_OUTER_R,
        longitude,
        ascendant,
      );

      ticks.push(
        <line
          key={`tick-${longitude}`}
          x1={round(radii.outer.x)}
          y1={round(radii.outer.y)}
          x2={round(radii.inner.x)}
          y2={round(radii.inner.y)}
          stroke={isLabelDegree ? "rgba(8,42,120,0.38)" : isFive ? "rgba(8,42,120,0.24)" : "rgba(8,42,120,0.12)"}
          strokeWidth={isLabelDegree ? "0.9" : isFive ? "0.7" : "0.48"}
        />,
      );

      if (isLabelDegree) {
        const hasNearbyPlanet = points.some((point) => circularDistance(point.longitude, longitude) <= 3);

        if (hasNearbyPlanet) {
          continue;
        }

        const label = pointAtRadius(ZODIAC_INNER_R - 23, longitude + 1.2, ascendant);
        labels.push(
          <g key={`tick-label-${longitude}`}>
            <circle cx={round(label.x)} cy={round(label.y)} r="8" fill="rgba(255,253,248,0.82)" />
            <text
              x={round(label.x)}
              y={round(label.y)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(6,19,49,0.86)"
              fontFamily="'Inter', sans-serif"
              fontSize="10.5"
              fontWeight="700"
              letterSpacing="0"
            >
              {degree}
            </text>
          </g>,
        );
      }
    }
  }

  return (
    <>
      <g>{ticks}</g>
      <g>{labels}</g>
    </>
  );
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

function HouseGeometry({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
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
        const lineStart = pointAtRadius(ZODIAC_INNER_R, house.longitude, ascendant);
        const lineEnd = pointAtRadius(HOUSE_INNER_R, house.longitude, ascendant);
        return (
          <line
            key={`house-line-${house.house}`}
            x1={round(lineStart.x)}
            y1={round(lineStart.y)}
            x2={round(lineEnd.x)}
            y2={round(lineEnd.y)}
            stroke="rgba(8,42,120,0.28)"
            strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "1.6" : "0.9"}
          />
        );
      })}

      {chart.houses.map((house, index) => {
        const nextHouse = chart.houses[(index + 1) % chart.houses.length] ?? chart.houses[0]!;
        const label = pointAtRadius(HOUSE_NUMBER_R, midpointLongitude(house.longitude, nextHouse.longitude), ascendant);
        return (
          <text
            key={`house-label-${house.house}`}
            x={round(label.x)}
            y={round(label.y)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(6,19,49,0.66)"
            fontFamily="'Inter', sans-serif"
            fontSize="13"
            fontWeight="500"
          >
            {house.house}
          </text>
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
    <g>
      {chart.houses.map((house, index) => {
        const nextHouse = chart.houses[(index + 1) % chart.houses.length] ?? chart.houses[0]!;
        const label = pointAtRadius(OUTER_SEP_R + 18, midpointLongitude(house.longitude, nextHouse.longitude), ascendant);

        return (
          <g key={`rs-house-label-${house.house}`}>
            <circle
              cx={label.x}
              cy={label.y}
              r="11"
              fill="#fffaf0"
              stroke="rgba(143,123,69,0.42)"
              strokeWidth="0.8"
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
              {house.house}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BiWheelChart({
  innerChart,
  outerChart,
  innerLabel = innerChart.event.name,
  outerLabel = outerChart?.event.name,
  variant = "solar-return",
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
  const colors = VARIANTS[variant];
  const [hoveredInner, setHoveredInner] = useState<ChartPointId | null>(null);
  const [uncontrolledSelectedInner, setUncontrolledSelectedInner] = useState<ChartPointId | null>(null);
  const [hoveredOuter, setHoveredOuter] = useState<ChartPointId | null>(null);
  const [uncontrolledSelectedOuter, setUncontrolledSelectedOuter] = useState<ChartPointId | null>(null);
  const innerPoints = useMemo(() => filterPoints(visiblePoints(innerChart), innerPointIds), [innerChart, innerPointIds]);
  const outerPoints = useMemo(() => outerChart ? filterPoints(visiblePoints(outerChart), outerPointIds) : [], [outerChart, outerPointIds]);
  const ascendant = innerChart.meta.ascendant;
  const innerLayouts = useMemo(() => planetLayouts({
    points: innerPoints,
    ascendant,
    defaultRadius: INNER_PLANET_LABEL_R + 8,
    defaultConnectorStartRadius: INNER_PLANET_LABEL_R + 2,
    defaultConnectorEndRadius: INNER_PLANET_LABEL_R + 8,
    clusterStartRadius: ZODIAC_INNER_R,
    clusterGlyphRadius: INNER_CLUSTER_CALLOUT_R,
    isInner: true,
  }), [ascendant, innerPoints]);
  const outerLayouts = useMemo(() => planetLayouts({
    points: outerPoints,
    ascendant,
    defaultRadius: OUTER_PLANET_R,
    defaultConnectorStartRadius: OUTER_SEP_R + 3,
    defaultConnectorEndRadius: OUTER_PLANET_R - 21,
    clusterStartRadius: ZODIAC_OUTER_R,
    clusterGlyphRadius: OUTER_CLUSTER_CALLOUT_R,
  }), [ascendant, outerPoints]);
  const selectedInner = selectedInnerPointId !== undefined ? selectedInnerPointId : uncontrolledSelectedInner;
  const selectedOuter = selectedOuterPointId !== undefined ? selectedOuterPointId : uncontrolledSelectedOuter;
  const outerActive = hoveredOuter || selectedOuter;
  const activeInner = hoveredInner ?? selectedInner;
  const activeOuter = hoveredOuter ?? selectedOuter;
  const hasAspectFocus = Boolean(activeInner || activeOuter);
  const activePoint = activeInner
    ? innerPoints.find((point) => point.id === activeInner)
    : outerPoints.find((point) => point.id === activeOuter);
  const orderedInnerPoints = [...innerPoints].sort((left, right) => {
    const leftActive = left.id === hoveredInner || left.id === selectedInner;
    const rightActive = right.id === hoveredInner || right.id === selectedInner;
    return Number(leftActive) - Number(rightActive);
  });
  const orderedOuterPoints = [...outerPoints].sort((left, right) => {
    const leftActive = left.id === hoveredOuter || left.id === selectedOuter;
    const rightActive = right.id === hoveredOuter || right.id === selectedOuter;
    return Number(leftActive) - Number(rightActive);
  });

  return (
    <div className="relative mx-auto w-[min(100%,calc(100vw-1.5rem))] max-w-[860px] pb-20 sm:pb-24">
      <svg viewBox="0 0 860 860" className="relative mb-16 h-auto w-full overflow-visible sm:mb-20" role="img" aria-label={outerChart ? `${innerLabel} / ${outerLabel}` : innerLabel}>
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

        <circle cx={CENTER} cy={CENTER} r="412" fill="url(#bw-surface-bg)" stroke="rgba(124,191,255,0.26)" strokeWidth="1.4" filter="url(#bw-glow)" />
        <circle cx={CENTER} cy={CENTER} r="398" fill="none" stroke="rgba(245,215,130,0.15)" strokeWidth="10" />
        <circle cx={CENTER} cy={CENTER} r="420" fill="url(#bw-field-glow)" />
        <circle cx={CENTER} cy={CENTER} r="392" fill="none" stroke="rgba(30,26,46,0.06)" strokeWidth="16" filter="url(#bw-soft-halo)" />
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
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R} fill="none" stroke="rgba(8,42,120,0.42)" strokeWidth="1.3" />
          <circle cx={CENTER} cy={CENTER} r={HOUSE_OUTER_R} fill="none" stroke="rgba(8,42,120,0.16)" strokeWidth="0.9" />
          <circle cx={CENTER} cy={CENTER} r={HOUSE_INNER_R} fill="none" stroke="rgba(8,42,120,0.12)" strokeWidth="0.8" />
          <DegreeTickRing ascendant={ascendant} points={innerPoints} />
          <HouseGeometry chart={innerChart} ascendant={ascendant} />
          <AxisLines chart={innerChart} ascendant={ascendant} />
          {innerChart.aspects.slice(0, 32).map((aspect) => {
            const from = innerPoints.find((point) => point.id === aspect.from);
            const to = innerPoints.find((point) => point.id === aspect.to);
            if (!from || !to) return null;
            const focused = activeInner ? aspect.from === activeInner || aspect.to === activeInner : !hasAspectFocus;
            const opacity = hasAspectFocus ? (focused ? 0.96 : 0.07) : 0.42;
            const start = pointAtRadius(172, from.longitude, ascendant);
            const end = pointAtRadius(172, to.longitude, ascendant);
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
                strokeWidth={focused ? "1.85" : "0.75"}
                strokeOpacity={opacity}
                filter={focused ? "url(#bw-aspect-neon)" : undefined}
              />
            );
          })}
          {showOuterAspects ? outerChart?.aspects.slice(0, 32).map((aspect) => {
            const from = outerPoints.find((point) => point.id === aspect.from);
            const to = outerPoints.find((point) => point.id === aspect.to);
            if (!from || !to) return null;
            const focused = activeOuter ? aspect.from === activeOuter || aspect.to === activeOuter : !hasAspectFocus;
            const opacity = hasAspectFocus ? (focused ? 0.9 : 0.06) : 0.26;
            const start = pointAtRadius(334, from.longitude, ascendant);
            const end = pointAtRadius(334, to.longitude, ascendant);
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
          {showInterAspects ? interAspects.slice(0, 36).map((aspect) => {
            const from = innerPoints.find((point) => point.id === aspect.pointA);
            const to = outerPoints.find((point) => point.id === aspect.pointB);
            if (!from || !to) return null;
            const focused = Boolean(
              (activeInner && aspect.pointA === activeInner) ||
              (activeOuter && aspect.pointB === activeOuter),
            );
            const opacity = hasAspectFocus ? (focused ? 0.92 : 0.05) : 0.3;
            const start = pointAtRadius(204, from.longitude, ascendant);
            const end = pointAtRadius(OUTER_SEP_R - 8, to.longitude, ascendant);
            return (
              <line
                key={`inter-${aspect.pointA}-${aspect.pointB}-${aspect.type}`}
                className="sarita-aspect-draw"
                pathLength={1}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={aspectStroke(aspect.type)}
                strokeWidth={focused ? "1.45" : "0.65"}
                strokeDasharray="3 5"
                strokeOpacity={opacity}
                filter={focused ? "url(#bw-aspect-neon)" : undefined}
              />
            );
          }) : null}
          <circle cx={CENTER} cy={CENTER} r="5" fill="rgba(30,26,46,0.62)" filter="url(#bw-glow)" />

          {orderedInnerPoints.map((point) => {
            const layout = innerLayouts.get(point.id);
            if (!layout) return null;
            const active = hoveredInner === point.id || selectedInner === point.id;
            const clusterActive = layout.clusterPointIds.some((pointId) => pointId === hoveredInner || pointId === selectedInner);
            const scale = hoveredInner === point.id ? 1.1 : selectedInner === point.id ? 1.08 : 1;
            const transform = scale !== 1 ? `translate(${layout.x} ${layout.y}) scale(${scale}) translate(${-layout.x} ${-layout.y})` : undefined;
            return (
              <g
                key={point.id}
                role="button"
                tabIndex={0}
                transform={transform}
                onMouseEnter={() => setHoveredInner(point.id)}
                onMouseLeave={() => setHoveredInner(null)}
                onClick={() => {
                  setUncontrolledSelectedInner(point.id);
                  setUncontrolledSelectedOuter(null);
                  onInnerPlanetSelect?.(point.id);
                }}
                opacity={outerActive && !active ? 0.45 : 1}
                className="cursor-pointer outline-none"
                style={{ outline: "none" }}
              >
                {layout.hasConnector ? (
                  <line
                    x1={layout.connectorStart.x}
                    y1={layout.connectorStart.y}
                    x2={layout.connectorEnd.x}
                    y2={layout.connectorEnd.y}
                    stroke={active ? colors.primary : clusterActive ? "rgba(245,215,130,0.64)" : "rgba(220,45,45,0.92)"}
                    strokeWidth={active ? "2.8" : clusterActive ? "1.65" : "1.9"}
                    strokeLinecap="round"
                  />
                ) : null}
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
                <circle cx={layout.x} cy={layout.y} r="20" fill="rgba(255,253,248,0.96)" stroke="rgba(0,102,255,0.24)" strokeWidth="0.9" filter="url(#bw-glow)" />
                <text
                  x={layout.x + planetGlyphOffset(point.id).x}
                  y={layout.y + planetGlyphOffset(point.id).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={planetGlyphInk(point.id)}
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize="27"
                  fontWeight="700"
                  stroke="#fffdf8"
                  strokeWidth="1.35"
                  paintOrder="stroke fill"
                  style={{ filter: active ? "url(#bw-hover-glow)" : "url(#bw-glow)" }}
                >
                  {POINT_SYMBOLS[point.id]}
                </text>
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
          const active = hoveredOuter === point.id || selectedOuter === point.id;
          const clusterActive = layout.clusterPointIds.some((pointId) => pointId === hoveredOuter || pointId === selectedOuter);
          const tickStart = layout.connectorStart;
          const tickEnd = layout.connectorEnd;
          const position = { x: layout.x, y: layout.y };
          const scale = hoveredOuter === point.id ? 1.1 : selectedOuter === point.id ? 1.08 : 1;
          const transform = scale !== 1 ? `translate(${position.x} ${position.y}) scale(${scale}) translate(${-position.x} ${-position.y})` : undefined;
          return (
            <g
              key={point.id}
              role="button"
              tabIndex={0}
              transform={transform}
              onMouseEnter={() => setHoveredOuter(point.id)}
              onMouseLeave={() => setHoveredOuter(null)}
              onClick={() => {
                setUncontrolledSelectedOuter(point.id);
                setUncontrolledSelectedInner(null);
                onOuterPlanetSelect?.(point.id);
              }}
              className="cursor-pointer outline-none"
              style={{ outline: "none" }}
            >
              {layout.hasConnector || !layout.isClustered ? (
                <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke={active ? colors.primary : clusterActive ? "rgba(245,215,130,0.64)" : "rgba(220,45,45,0.92)"} strokeWidth={active ? "2.8" : clusterActive ? "1.65" : "1.9"} strokeLinecap="round" />
              ) : null}
              {active ? (
                <circle cx={position.x} cy={position.y} r="28" fill="rgba(232,197,71,0.08)" stroke={colors.primary} strokeOpacity="0.55" strokeWidth="1.1" />
              ) : null}
              <circle cx={position.x} cy={position.y} r="20" fill="rgba(255,253,248,0.96)" stroke="rgba(0,102,255,0.24)" strokeWidth="0.9" filter="url(#bw-glow)" />
              <text
                x={position.x + planetGlyphOffset(point.id).x}
                y={position.y + planetGlyphOffset(point.id).y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={planetGlyphInk(point.id)}
                fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                fontSize="27"
                fontWeight="700"
                stroke="#fffdf8"
                strokeWidth="1.35"
                paintOrder="stroke fill"
                style={{ filter: active ? "url(#bw-outer-glow)" : "url(#bw-glow)" }}
              >
                {POINT_SYMBOLS[point.id]}
              </text>
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

        {outerChart && variant === "solar-return" ? (
          <>
            <SolarReturnHouseLabels chart={outerChart} ascendant={ascendant} />
            <SolarReturnAngleMarkers chart={outerChart} ascendant={ascendant} />
          </>
        ) : null}

      </svg>

      {activePoint ? (
        <div className="pointer-events-none mx-auto mt-5 flex w-fit max-w-[min(24rem,88vw)] items-center justify-center gap-2 rounded-full border border-[#f5d782]/35 bg-[#061331]/75 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#fffaf0] shadow-[0_16px_42px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <span className="font-serif text-base leading-none text-[#f5d782]">{POINT_SYMBOLS[activePoint.id]}</span>
          <span>{degreeLabel(activePoint)}</span>
        </div>
      ) : null}

      <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
        <span className="inline-flex max-w-[min(22rem,86vw)] items-center justify-center gap-2 rounded-full border border-[#d7e7ff]/16 bg-[#061331]/60 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md [overflow-wrap:normal] [word-break:normal]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fffaf0]" />
          {innerLabel}
        </span>
        {outerChart ? (
          <span className="inline-flex max-w-[min(22rem,86vw)] items-center justify-center gap-2 rounded-full border border-[#d7e7ff]/16 bg-[#061331]/60 px-4 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md [overflow-wrap:normal] [word-break:normal]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
            {outerLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
