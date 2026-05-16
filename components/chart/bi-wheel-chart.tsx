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
const HOUSE_OUTER_R = 252;
const HOUSE_INNER_R = 168;
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

const SIGN_SYMBOLS = {
  aries: "\u2648\ufe0e",
  taurus: "\u2649\ufe0e",
  gemini: "\u264a\ufe0e",
  cancer: "\u264b\ufe0e",
  leo: "\u264c\ufe0e",
  virgo: "\u264d\ufe0e",
  libra: "\u264e\ufe0e",
  scorpio: "\u264f\ufe0e",
  Sagittarius: "\u2650\ufe0e",
  sagittarius: "\u2650\ufe0e",
  capricorn: "\u2651\ufe0e",
  aquarius: "\u2652\ufe0e",
  pisces: "\u2653\ufe0e",
} as const;

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

function zodiacLabelFill(element: (typeof zodiacSigns)[number]["element"]) {
  return "#061331";
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

function planetLayouts(points: ChartPoint[], ascendant: number) {
  const clusters: ChartPoint[][] = [];
  const sortedPoints = [...points].sort((left, right) => left.longitude - right.longitude);
  let currentCluster: ChartPoint[] = [];

  for (const point of sortedPoints) {
    const previous = currentCluster[currentCluster.length - 1];

    if (!previous || circularDistance(previous.longitude, point.longitude) <= 5) {
      currentCluster.push(point);
      continue;
    }

    clusters.push(currentCluster);
    currentCluster = [point];
  }

  if (currentCluster.length) {
    const firstCluster = clusters[0]?.[0];
    const lastCluster = currentCluster[currentCluster.length - 1];

    if (clusters.length > 0 && firstCluster && lastCluster && circularDistance(firstCluster.longitude, lastCluster.longitude) <= 5) {
      clusters[0] = [...currentCluster, ...clusters[0]];
    } else {
      clusters.push(currentCluster);
    }
  }

  const layouts = new Map<ChartPointId, { x: number; y: number; connectorStart: { x: number; y: number }; hasConnector: boolean }>();

  clusters.forEach((cluster) => {
    const sortedCluster = [...cluster].sort((left, right) => left.longitude - right.longitude);
    const clusterCenter = sortedCluster.reduce((sum, point) => sum + point.longitude, 0) / sortedCluster.length;

    sortedCluster.forEach((point, index) => {
      const angle = (pointAngle(clusterCenter, ascendant) * Math.PI) / 180;
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const centeredIndex = index - (sortedCluster.length - 1) / 2;
      const tangentOffset = sortedCluster.length > 1 ? centeredIndex * 34 : 0;
      const stackPull = Math.abs(centeredIndex) * 4;
      const base = pointAtRadius(INNER_PLANET_LABEL_R + 8 - stackPull, clusterCenter, ascendant);

      layouts.set(point.id, {
        x: base.x + tangentX * tangentOffset,
        y: base.y + tangentY * tangentOffset,
        connectorStart: pointAtRadius(INNER_PLANET_LABEL_R + 2, point.longitude, ascendant),
        hasConnector: sortedCluster.length > 1 || Math.abs(point.longitude - clusterCenter) > 1,
      });
    });
  });

  return layouts;
}

function DegreeTickRing({ ascendant }: { ascendant: number }) {
  const ticks = [];

  for (const sign of zodiacSigns) {
    for (let degree = 0; degree < 30; degree += 1) {
      const longitude = sign.start + degree;
      const major = degree === 0 || degree === 15;
      const medium = degree % 5 === 0;
      const radii = lineBetween(
        major ? ZODIAC_INNER_R : medium ? ZODIAC_INNER_R + 5 : ZODIAC_INNER_R + 10,
        ZODIAC_OUTER_R,
        longitude,
        ascendant,
      );

      ticks.push(
        <line
          key={`tick-${longitude}`}
          x1={radii.inner.x}
          y1={radii.inner.y}
          x2={radii.outer.x}
          y2={radii.outer.y}
          stroke={major ? "rgba(30,26,46,0.22)" : medium ? "rgba(30,26,46,0.14)" : "rgba(30,26,46,0.08)"}
          strokeWidth={major ? "0.8" : "0.45"}
        />,
      );

      if (degree === 0) {
        const label = pointAtRadius(ZODIAC_INNER_R + 26, longitude + 1.2, ascendant);
        ticks.push(
          <text
            key={`tick-label-${longitude}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] font-semibold"
            fill="rgba(30,26,46,0.56)"
          >
            {degree}
          </text>,
        );
      }
    }
  }

  return <>{ticks}</>;
}

function AxisLines({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  const axes = [
    { longitude: chart.meta.ascendant, opposite: chart.meta.descendant, start: "AC", end: "DC" },
    { longitude: chart.meta.mc, opposite: chart.meta.ic, start: "MC", end: "IC" },
  ];

  return (
    <>
      {axes.map((axis) => {
        const start = pointAtRadius(ZODIAC_OUTER_R + 4, axis.longitude, ascendant);
        const end = pointAtRadius(ZODIAC_OUTER_R + 4, axis.opposite, ascendant);
        const startLabel = pointAtRadius(ZODIAC_OUTER_R - 12, axis.longitude, ascendant);
        const endLabel = pointAtRadius(ZODIAC_OUTER_R - 12, axis.opposite, ascendant);

        return (
          <g key={axis.start}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="rgba(30,26,46,0.58)" strokeWidth="1.1" />
            {[
              { label: axis.start, point: startLabel },
              { label: axis.end, point: endLabel },
            ].map(({ label, point }) => (
              <g key={label}>
                <rect x={point.x - 13} y={point.y - 8} width="26" height="16" rx="7" fill="#fffaf0" stroke="rgba(30,26,46,0.28)" strokeWidth="0.8" />
                <text x={point.x} y={point.y + 0.5} textAnchor="middle" dominantBaseline="central" className="font-serif text-[11px] font-semibold" fill="#1e1a2e">
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
  onInnerPlanetSelect,
  onOuterPlanetSelect,
}: BiWheelChartProps) {
  const colors = VARIANTS[variant];
  const [hoveredInner, setHoveredInner] = useState<ChartPointId | null>(null);
  const [selectedInner, setSelectedInner] = useState<ChartPointId | null>(null);
  const [hoveredOuter, setHoveredOuter] = useState<ChartPointId | null>(null);
  const [selectedOuter, setSelectedOuter] = useState<ChartPointId | null>(null);
  const innerPoints = useMemo(() => filterPoints(visiblePoints(innerChart), innerPointIds), [innerChart, innerPointIds]);
  const outerPoints = useMemo(() => outerChart ? filterPoints(visiblePoints(outerChart), outerPointIds) : [], [outerChart, outerPointIds]);
  const ascendant = innerChart.meta.ascendant;
  const innerLayouts = useMemo(() => planetLayouts(innerPoints, ascendant), [ascendant, innerPoints]);
  const outerActive = hoveredOuter || selectedOuter;
  const activeInner = hoveredInner ?? selectedInner;
  const activeOuter = hoveredOuter ?? selectedOuter;
  const hasAspectFocus = Boolean(activeInner || activeOuter);
  const activePoint = activeInner
    ? innerPoints.find((point) => point.id === activeInner)
    : outerPoints.find((point) => point.id === activeOuter);

  return (
    <div className="relative mx-auto w-[min(100%,calc(100vw-1.5rem))] max-w-[860px]">
      <svg viewBox="0 0 860 860" className="relative h-auto w-full overflow-visible" role="img" aria-label={outerChart ? `${innerLabel} / ${outerLabel}` : innerLabel}>
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
          <circle cx={CENTER} cy={CENTER} r="386" fill="rgba(255,250,240,0.28)" stroke="rgba(30,26,46,0.2)" />
          <circle cx={CENTER} cy={CENTER} r="356" fill="none" stroke="rgba(30,26,46,0.08)" strokeWidth="18" />
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
                  className="font-serif text-[32px] font-bold"
                  fill={zodiacLabelFill(sign.element)}
                  fillOpacity="0.92"
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  stroke="rgba(255,253,248,0.86)"
                  strokeWidth="1.15"
                  paintOrder="stroke fill"
                  style={{ filter: "drop-shadow(0 0 6px rgba(124,191,255,0.18))" }}
                >
                  {SIGN_SYMBOLS[sign.id]}
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
          <DegreeTickRing ascendant={ascendant} />
          {innerChart.houses.map((house) => {
            const lineStart = pointAtRadius(ZODIAC_INNER_R, house.longitude, ascendant);
            const lineEnd = pointAtRadius(HOUSE_INNER_R, house.longitude, ascendant);
            return (
              <line
                key={house.house}
                x1={lineStart.x}
                y1={lineStart.y}
                x2={lineEnd.x}
                y2={lineEnd.y}
                stroke="rgba(30,26,46,0.22)"
                strokeWidth="0.8"
              />
            );
          })}
          <AxisLines chart={innerChart} ascendant={ascendant} />
          {innerChart.houses.map((house, index) => {
            const nextHouse = innerChart.houses[(index + 1) % innerChart.houses.length] ?? innerChart.houses[0]!;
            const label = pointAtRadius(230, midpointLongitude(house.longitude, nextHouse.longitude), ascendant);
            return (
              <text
                key={`house-label-${house.house}`}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[15px] font-semibold"
                fill="rgba(30,26,46,0.52)"
              >
                {house.house}
              </text>
            );
          })}
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

          {innerPoints.map((point) => {
            const layout = innerLayouts.get(point.id);
            if (!layout) return null;
            const active = hoveredInner === point.id || selectedInner === point.id;
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
                  setSelectedInner(point.id);
                  setSelectedOuter(null);
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
                    x2={layout.x}
                    y2={layout.y}
                    stroke="rgba(0,102,255,0.22)"
                    strokeWidth="0.55"
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
                  x={layout.x}
                  y={layout.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={point.color}
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize="27"
                  fontWeight="700"
                  stroke="#fffdf8"
                  strokeWidth="1.8"
                  paintOrder="stroke fill"
                  style={{ filter: active ? "url(#bw-hover-glow)" : "url(#bw-glow)" }}
                >
                  {POINT_SYMBOLS[point.id]}
                </text>
              </g>
            );
          })}
        </g>

        {outerPoints.map((point) => {
          const active = hoveredOuter === point.id || selectedOuter === point.id;
          const tickStart = pointAtRadius(OUTER_SEP_R + 3, point.longitude, ascendant);
          const tickEnd = pointAtRadius(OUTER_PLANET_R - 21, point.longitude, ascendant);
          const position = pointAtRadius(OUTER_PLANET_R, point.longitude, ascendant);
          return (
            <g
              key={point.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredOuter(point.id)}
              onMouseLeave={() => setHoveredOuter(null)}
              onClick={() => {
                setSelectedOuter(point.id);
                setSelectedInner(null);
                onOuterPlanetSelect?.(point.id);
              }}
              className="cursor-pointer outline-none"
              style={{ outline: "none" }}
            >
              <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke={active ? colors.primary : "rgba(0,102,255,0.22)"} strokeWidth={active ? "1.4" : "0.7"} strokeLinecap="round" />
              {active ? (
                <circle cx={position.x} cy={position.y} r="28" fill="rgba(232,197,71,0.08)" stroke={colors.primary} strokeOpacity="0.55" strokeWidth="1.1" />
              ) : null}
              <circle cx={position.x} cy={position.y} r="20" fill="rgba(255,253,248,0.96)" stroke="rgba(0,102,255,0.24)" strokeWidth="0.9" filter="url(#bw-glow)" />
              <text
                x={position.x}
                y={position.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={point.color}
                fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                fontSize="27"
                fontWeight="700"
                stroke="#fffdf8"
                strokeWidth="1.8"
                paintOrder="stroke fill"
                style={{ filter: active ? "url(#bw-outer-glow)" : "url(#bw-glow)" }}
              >
                {POINT_SYMBOLS[point.id]}
              </text>
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
