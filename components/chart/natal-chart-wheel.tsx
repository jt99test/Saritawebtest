"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";

import {
  getAugmentedChartPoints,
  zodiacSigns,
  type Aspect,
  type AspectId,
  type ChartPoint,
  type ChartPointId,
  type HouseCusp,
  type NatalChartData,
} from "@/lib/chart";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries, type Dictionary } from "@/lib/i18n";
import { useChartStore } from "@/components/chart/chart-store";

type Props = {
  chart: NatalChartData;
  viewerMode?: boolean;
};

type TooltipState = {
  id: string;
  xPercent: number;
  yPercent: number;
  content: string;
};

const SIZE = 860;
const CX = 430;
const CY = 430;

const ZODIAC_OUTER = 402;
const ZODIAC_INNER = 344;
const PLANET_RING_RADIUS = 286;
const PLANET_LABEL_RADIUS = 314;
const PLANET_CLUSTER_CALLOUT_RADIUS = 314;
const PLANET_CLUSTER_FAN_STEP = 6.5;
const PLANET_CLUSTER_THRESHOLD_DEGREES = 11;
const PLANET_CONFLICT_DEGREES = 11;
const HOUSE_OUTER = 252;
const HOUSE_INNER = 142;
const HOUSE_NUMBER_RADIUS = 162;
const HOUSE_NUMBER_LABEL_RADIUS = 152;
const ASPECT_RADIUS = 134;
const PLANET_EDGE_MARGIN = 34;

const SYMBOLIC_ASPECT_COLORS: Record<AspectId, string> = {
  conjunction: "rgba(255,219,110,0.98)",
  opposition: "rgba(255,166,74,0.94)",
  square: "rgba(255,88,146,0.94)",
  trine: "rgba(86,178,255,0.96)",
  sextile: "rgba(84,245,220,0.9)",
  quincunx: "rgba(190,150,255,0.82)",
};

const ASPECT_SYMBOLS: Record<AspectId, string> = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
  quincunx: "⚻",
};

const POINT_GLYPHS: Record<ChartPointId, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  northNode: "☊",
  southNode: "☋",
  chiron: "⚷",
  partOfFortune: "⊗",
  lilith: "⚸",
  ceres: "⚳",
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

function pointSignGlyph(point: ChartPoint) {
  return zodiacSigns.find((sign) => sign.id === point.sign)?.glyph ?? "";
}

const DISPLAY_ASPECTS: Array<{ type: AspectId; angle: number; orb: number; major: boolean }> = [
  { type: "conjunction", angle: 0, orb: 7, major: true },
  { type: "sextile", angle: 60, orb: 7, major: true },
  { type: "square", angle: 90, orb: 7, major: true },
  { type: "trine", angle: 120, orb: 7, major: true },
  { type: "quincunx", angle: 150, orb: 3, major: false },
  { type: "opposition", angle: 180, orb: 7, major: true },
];

function pointAtRadius(radius: number, longitude: number, ascendant: number): [number, number] {
  const angle = ((180 + ascendant - longitude) * Math.PI) / 180;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function pointAngle(longitude: number, ascendant: number) {
  return ((180 + ascendant - longitude) * Math.PI) / 180;
}

function radiusInsideChart(desiredRadius: number, angle: number) {
  const radialX = Math.cos(angle);
  const radialY = Math.sin(angle);
  const maxX = radialX > 0
    ? (SIZE - PLANET_EDGE_MARGIN - CX) / radialX
    : radialX < 0
      ? (PLANET_EDGE_MARGIN - CX) / radialX
      : Number.POSITIVE_INFINITY;
  const maxY = radialY > 0
    ? (SIZE - PLANET_EDGE_MARGIN - CY) / radialY
    : radialY < 0
      ? (PLANET_EDGE_MARGIN - CY) / radialY
      : Number.POSITIVE_INFINITY;

  return Math.min(desiredRadius, maxX, maxY);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clampViewerZoom(value: number) {
  return Math.min(2.8, Math.max(1, Math.round(value * 100) / 100));
}

function getTouchDistance(touches: { item(index: number): { clientX: number; clientY: number } | null }) {
  const first = touches.item(0);
  const second = touches.item(1);

  if (!first || !second) {
    return null;
  }

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function circularDistance(first: number, second: number) {
  const difference = Math.abs(first - second);
  return difference > 180 ? 360 - difference : difference;
}

function normalizeLongitude(longitude: number) {
  const normalized = longitude % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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

  return { start, min, max };
}

function unwrapLongitudeFromStart(longitude: number, start: number) {
  const normalized = normalizeLongitude(longitude);
  return normalized < start ? normalized + 360 : normalized;
}

function clampedLongitude(longitude: number, min: number, max: number) {
  return normalizeLongitude(Math.min(Math.max(longitude, min), max));
}

function pointScaleTransform(x: number, y: number, scale: number) {
  return `translate(${round(x)} ${round(y)}) scale(${scale}) translate(${-round(x)} ${-round(y)})`;
}

function describeRingSegment(
  innerRadius: number,
  outerRadius: number,
  startLongitude: number,
  endLongitude: number,
  ascendant: number,
) {
  const [x1, y1] = pointAtRadius(outerRadius, startLongitude, ascendant);
  const [x2, y2] = pointAtRadius(outerRadius, endLongitude, ascendant);
  const [x3, y3] = pointAtRadius(innerRadius, endLongitude, ascendant);
  const [x4, y4] = pointAtRadius(innerRadius, startLongitude, ascendant);
  const largeArc = endLongitude - startLongitude > 180 ? 1 : 0;

  return `M${round(x1)},${round(y1)} A${outerRadius},${outerRadius},0,${largeArc},0,${round(x2)},${round(y2)} L${round(x3)},${round(y3)} A${innerRadius},${innerRadius},0,${largeArc},1,${round(x4)},${round(y4)} Z`;
}

function getAspectDefinition(type: AspectId) {
  return DISPLAY_ASPECTS.find((entry) => entry.type === type)!;
}

function TickRing(_: {
  ascendant: number;
  showDegrees: boolean;
  points: ChartPoint[];
}) {
  return null;
}

function SymbolicWheelFrame({ ascendant }: { ascendant: number }) {
  const elementTints = {
    fire: "rgba(255,105,145,0.14)",
    earth: "rgba(245,215,130,0.12)",
    air: "rgba(86,178,255,0.14)",
    water: "rgba(84,245,220,0.12)",
  } as const;

  return (
    <>
      {zodiacSigns.map((sign) => (
        <path
          key={`tint-${sign.id}`}
          d={describeRingSegment(ZODIAC_INNER, ZODIAC_OUTER, sign.start, sign.start + 30, ascendant)}
          fill={elementTints[sign.element]}
          stroke="rgba(8,42,120,0.16)"
          strokeWidth="1"
        />
      ))}

      <circle cx={CX} cy={CY} r={ZODIAC_OUTER + 2} fill="none" stroke="rgba(0,102,255,0.26)" strokeWidth="1.3" />
      <circle cx={CX} cy={CY} r={ZODIAC_OUTER - 12} fill="none" stroke="rgba(245,215,130,0.24)" strokeWidth="0.8" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER + 12} fill="none" stroke="rgba(124,191,255,0.18)" strokeWidth="0.8" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER} fill="none" stroke="rgba(8,42,120,0.42)" strokeWidth="1.3" />
      <circle cx={CX} cy={CY} r={HOUSE_INNER} fill="none" stroke="rgba(5,7,12,0.28)" strokeWidth="0.9" />

      {zodiacSigns.map((sign) => {
        const [x, y] = pointAtRadius((ZODIAC_OUTER + ZODIAC_INNER) / 2, sign.start + 15, ascendant);

        return (
          <text
            key={`sign-glyph-${sign.id}`}
            x={round(x)}
            y={round(y)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#061331"
            fillOpacity="0.92"
            fontSize="32"
            fontWeight="700"
            fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
            stroke="rgba(255,253,248,0.86)"
            strokeWidth="1.15"
            paintOrder="stroke fill"
            style={{ filter: "drop-shadow(0 0 6px rgba(124,191,255,0.18))" }}
          >
            {sign.glyph}
          </text>
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
            d={describeRingSegment(HOUSE_INNER, HOUSE_OUTER, current, end, ascendant)}
            fill={tone}
            stroke="none"
          />
        );
      })}

      {chart.houses.map((house) => {
        const [outerX, outerY] = pointAtRadius(ZODIAC_INNER, house.longitude, ascendant);
        const [innerX, innerY] = pointAtRadius(HOUSE_INNER, house.longitude, ascendant);
        return (
          <line
            key={`house-line-${house.house}`}
            x1={round(outerX)}
            y1={round(outerY)}
            x2={round(innerX)}
            y2={round(innerY)}
            stroke={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? "rgba(5,7,12,0.68)" : "rgba(5,7,12,0.48)"}
            strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? 1.8 : 1.15}
          />
        );
      })}

      <circle cx={CX} cy={CY} r={HOUSE_NUMBER_RADIUS} fill="none" stroke="rgba(5,7,12,0.36)" strokeWidth="0.85" />

      {chart.houses.map((house, index) => {
        const current = house.longitude;
        const next = chart.houses[(index + 1) % 12]!.longitude;
        const midpoint = current + ((next - current + 360) % 360) / 2;
        const [x, y] = pointAtRadius(HOUSE_NUMBER_LABEL_RADIUS, midpoint, ascendant);

        return (
          <g key={`house-number-${house.house}`}>
            <text
              x={round(x)}
              y={round(y)}
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

function AxisLines({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  const axes = [
    { longitude: chart.meta.ascendant, weight: 1.8, start: "AC", end: "DC" },
    { longitude: chart.meta.mc, weight: 1.1, start: "MC", end: "IC" },
  ];

  return (
    <>
      {axes.map((axis) => {
        const [x1, y1] = pointAtRadius(ZODIAC_OUTER + 2, axis.longitude, ascendant);
        const [x2, y2] = pointAtRadius(ZODIAC_OUTER + 2, axis.longitude + 180, ascendant);
        const [labelStartX, labelStartY] = pointAtRadius(ZODIAC_OUTER - 12, axis.longitude, ascendant);
        const [labelEndX, labelEndY] = pointAtRadius(ZODIAC_OUTER - 12, axis.longitude + 180, ascendant);

        return (
          <g key={`axis-${axis.longitude}`}>
            <line
              x1={round(x1)}
              y1={round(y1)}
              x2={round(x2)}
              y2={round(y2)}
              stroke="rgba(6,19,49,0.74)"
              strokeWidth={axis.weight}
            />
            <g transform={`translate(${round(labelStartX)} ${round(labelStartY)})`}>
              <rect
                x={-20}
                y={-11}
                width={40}
                height={22}
                rx={11}
                fill="#fffdf8"
                stroke="rgba(0,102,255,0.28)"
                strokeWidth="1"
                filter="url(#planet-glow)"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#061331"
                fontFamily="'Spectral', serif"
                fontSize="14"
                fontWeight="700"
                letterSpacing="0.04em"
              >
                {axis.start}
              </text>
            </g>
            <g transform={`translate(${round(labelEndX)} ${round(labelEndY)})`}>
              <rect
                x={-20}
                y={-11}
                width={40}
                height={22}
                rx={11}
                fill="#fffdf8"
                stroke="rgba(0,102,255,0.28)"
                strokeWidth="1"
                filter="url(#planet-glow)"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#061331"
                fontFamily="'Spectral', serif"
                fontSize="14"
                fontWeight="700"
                letterSpacing="0.04em"
              >
                {axis.end}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}

type ClearPointLayout = {
  glyphX: number;
  glyphY: number;
  visualLongitude: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "end" | "middle";
  retrogradeX: number;
  retrogradeY: number;
  connectorX1: number;
  connectorY1: number;
  connectorX2: number;
  connectorY2: number;
  hasConnector: boolean;
  isClustered: boolean;
  clusterPointIds: ChartPointId[];
};

function SymbolicAspects({
  aspects,
  pointsById,
  pointLayouts,
  dictionary,
  ascendant,
  activePointId,
  hoveredPointId,
  highlightedAspectId,
  hoveredAspectId,
  selectedAspectId,
  onHoverAspect,
  onClickAspect,
}: {
  aspects: Aspect[];
  pointsById: Map<ChartPointId, ChartPoint>;
  pointLayouts?: Map<ChartPointId, ClearPointLayout>;
  dictionary: Dictionary;
  ascendant: number;
  activePointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  highlightedAspectId: string | null;
  hoveredAspectId: string | null;
  selectedAspectId: string | null;
  onHoverAspect: (tooltip: TooltipState | null, aspectId?: string | null) => void;
  onClickAspect: (aspect: Aspect) => void;
}) {
  const focusPointId = activePointId;

  return (
    <>
      {aspects.map((aspect) => {
        const fromPoint = pointsById.get(aspect.from);
        const toPoint = pointsById.get(aspect.to);

        if (!fromPoint || !toPoint) {
          return null;
        }

        const fromLayout = pointLayouts?.get(aspect.from);
        const toLayout = pointLayouts?.get(aspect.to);
        const [x1, y1] = pointAtRadius(ASPECT_RADIUS, fromLayout?.visualLongitude ?? fromPoint.longitude, ascendant);
        const [x2, y2] = pointAtRadius(ASPECT_RADIUS, toLayout?.visualLongitude ?? toPoint.longitude, ascendant);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const definition = getAspectDefinition(aspect.type);
        const focused = focusPointId ? aspect.from === focusPointId || aspect.to === focusPointId : true;
        if (focusPointId && !focused) {
          return null;
        }
        const highlighted = highlightedAspectId === aspect.id;
        const hovered = hoveredAspectId === aspect.id;
        const selected = selectedAspectId === aspect.id;
        const hasPointFocus = Boolean(focusPointId);
        const strokeOpacity = hovered
          ? 0.85
          : hasPointFocus
            ? focused
              ? 0.85
              : 0.12
            : selectedAspectId
              ? selected
                ? 0.9
                : 0.05
              : highlightedAspectId
                ? highlighted
                  ? 0.85
                  : 0.1
                : 0.65;
        const strokeWidth = selected || highlighted || hovered || (hasPointFocus && focused)
          ? 1.4
          : definition.major
            ? 1.4
            : 0.8;
        const tooltip = `${dictionary.result.aspectTypes[aspect.type]} - ${dictionary.result.points[aspect.from]} / ${dictionary.result.points[aspect.to]} - ${dictionary.result.fields.orb} ${aspect.orb.toFixed(1)}°`;

        return (
          <g
            key={aspect.id}
            role="button"
            tabIndex={0}
            aria-label={tooltip}
            style={{ cursor: "pointer" }}
            onClick={(event) => {
              event.stopPropagation();
              onClickAspect(aspect);
            }}
            onMouseEnter={() =>
              onHoverAspect(
                {
                  id: aspect.id,
                  xPercent: (mx / SIZE) * 100,
                  yPercent: (my / SIZE) * 100,
                  content: tooltip,
                },
                aspect.id,
              )
            }
            onMouseLeave={() => onHoverAspect(null, null)}
            onFocus={() =>
              onHoverAspect(
                {
                  id: aspect.id,
                  xPercent: (mx / SIZE) * 100,
                  yPercent: (my / SIZE) * 100,
                  content: tooltip,
                },
                aspect.id,
              )
            }
            onBlur={() => onHoverAspect(null, null)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClickAspect(aspect);
              }
            }}
          >
            <line
              className="sarita-aspect-draw"
              pathLength={1}
              x1={round(x1)}
              y1={round(y1)}
              x2={round(x2)}
              y2={round(y2)}
              stroke="transparent"
              strokeWidth={12}
            />
            <line
              x1={round(x1)}
              y1={round(y1)}
              x2={round(x2)}
              y2={round(y2)}
              stroke={SYMBOLIC_ASPECT_COLORS[aspect.type]}
              strokeOpacity={strokeOpacity}
              strokeWidth={strokeWidth}
              strokeDasharray={aspect.type === "quincunx" ? "2 3" : undefined}
              strokeLinecap="round"
              filter={strokeOpacity > 0.18 ? "url(#aspect-neon-glow)" : undefined}
            />
          </g>
        );
      })}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _PlanetLayer({
  points,
  dictionary,
  ascendant,
  selectedPointId,
  hoveredPointId,
  panelOpen,
  showDegrees,
  hoveredAspectId,
  onSelect,
  onHover,
}: {
  points: ChartPoint[];
  dictionary: Dictionary;
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  onSelect: (pointId: ChartPointId, tooltip?: TooltipState) => void;
  onHover: (tooltip: TooltipState | null, pointId?: ChartPointId | null) => void;
}) {
  const highlightedAspect = hoveredAspectId ? hoveredAspectId.split("-") : null;

  return (
    <>
      {[...points].sort((left, right) => {
        const leftActive = left.id === hoveredPointId || left.id === selectedPointId;
        const rightActive = right.id === hoveredPointId || right.id === selectedPointId;
        return Number(leftActive) - Number(rightActive);
      }).map((point) => {
        const [glyphX, glyphY] = pointAtRadius(PLANET_RING_RADIUS, point.longitude, ascendant);
        const [labelX, labelY] = pointAtRadius(PLANET_LABEL_RADIUS, point.longitude, ascendant);
        const angle = ((180 + ascendant - point.longitude) * Math.PI) / 180;
        const horizontal = Math.cos(angle);
        const anchor = horizontal < -0.24 ? "end" : horizontal > 0.24 ? "start" : "middle";
        const active = hoveredPointId === point.id || selectedPointId === point.id;
        const scale = selectedPointId === point.id && panelOpen ? 1.15 : hoveredPointId === point.id ? 1.1 : 1;
        const glow =
          selectedPointId === point.id && panelOpen
            ? "url(#planet-hover-glow)"
            : hoveredPointId === point.id
              ? "url(#planet-hover-glow)"
              : "url(#planet-glow)";
        const textColor = point.id === "sun" ? "#ffe0a3" : point.id === "moon" ? "#f6f2ff" : "#f7f2ea";
        const partOfHighlightedAspect =
          highlightedAspect && (highlightedAspect[0] === point.id || highlightedAspect[1] === point.id);
        const opacity = panelOpen && selectedPointId
          ? selectedPointId === point.id || partOfHighlightedAspect
            ? 1
            : 0.6
          : 1;
        const tooltip = dictionary.result.points[point.id];

        return (
          <g
            key={point.id}
            data-chart-point={point.id}
            transform={scale !== 1 ? pointScaleTransform(glyphX, glyphY, scale) : undefined}
            onClick={() => onSelect(point.id, {
              id: point.id,
              xPercent: (glyphX / SIZE) * 100,
              yPercent: (glyphY / SIZE) * 100,
              content: tooltip,
            })}
            onMouseEnter={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onMouseLeave={() => onHover(null, null)}
            onFocus={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onBlur={() => onHover(null, null)}
            role="button"
            aria-label={tooltip}
            tabIndex={0}
            style={{ cursor: "pointer", opacity }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(point.id, {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                });
              }
            }}
          >
            {(active || point.id === "sun") && (
              <circle
                cx={round(glyphX)}
                cy={round(glyphY)}
                r={point.id === "sun" ? 20 : 18}
                fill="none"
                stroke={point.id === "sun" ? "rgba(255,209,119,0.82)" : "rgba(255,244,220,0.3)"}
                strokeWidth={point.id === "sun" ? 1.5 : 1}
              />
            )}

            <text
              x={round(glyphX)}
              y={round(glyphY)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={textColor}
              fillOpacity="1"
              fontSize={point.id === "sun" ? "28" : "26"}
              fontWeight="500"
              style={{ filter: glow }}
            >
              {point.glyph}
            </text>

            {active ? (
              <g>
              <rect
                x={round(labelX - 24)}
                y={round(labelY - 15)}
                width={48}
                height={18}
                rx={9}
                fill="rgba(6,3,16,0.82)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={0.6}
              />
              <text
                x={round(labelX)}
                y={round(labelY - 6)}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="rgba(232,224,240,0.9)"
                fontFamily="'Inter', sans-serif"
                fontSize="12.3"
                fontWeight="500"
                letterSpacing="0.02em"
              >
                {String(point.degreeInSign).padStart(2, "0")}° {String(point.minutesInSign).padStart(2, "0")}&apos;
              </text>
              </g>
            ) : null}

            {point.retrograde && active ? (
              <text
                x={round(labelX)}
                y={round(labelY + 8)}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="rgba(232,197,71,0.92)"
                fontFamily="'Spectral', serif"
                fontSize="10.5"
              >
                ?
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _AstroSeekPlanetLayer({
  points,
  dictionary,
  ascendant,
  selectedPointId,
  hoveredPointId,
  panelOpen,
  showDegrees,
  hoveredAspectId,
  onSelect,
  onHover,
}: {
  points: ChartPoint[];
  dictionary: Dictionary;
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  onSelect: (pointId: ChartPointId, tooltip?: TooltipState) => void;
  onHover: (tooltip: TooltipState | null, pointId?: ChartPointId | null) => void;
}) {
  const highlightedAspect = hoveredAspectId ? hoveredAspectId.split("-") : null;
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

    if (
      clusters.length > 0 &&
      firstCluster &&
      lastCluster &&
      circularDistance(firstCluster.longitude, lastCluster.longitude) <= 5
    ) {
      clusters[0] = [...currentCluster, ...clusters[0]];
    } else {
      clusters.push(currentCluster);
    }
  }

  const pointLayouts = new Map<
    ChartPointId,
    {
      glyphX: number;
      glyphY: number;
      labelX: number;
      labelY: number;
      angle: number;
    }
  >();

  clusters.forEach((cluster) => {
    cluster.forEach((point, index) => {
      const radialOffset = cluster.length > 1 ? index * 12 : 0;
      const glyphRadius = PLANET_LABEL_RADIUS - radialOffset;
      const [glyphX, glyphY] = pointAtRadius(glyphRadius, point.longitude, ascendant);
      const angle = pointAngle(point.longitude, ascendant);
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const labelOffset = 16;

      pointLayouts.set(point.id, {
        glyphX,
        glyphY,
        labelX: glyphX + tangentX * labelOffset,
        labelY: glyphY + tangentY * labelOffset,
        angle,
      });
    });
  });

  return (
    <>
      {points.map((point) => {
        const layout = pointLayouts.get(point.id);
        if (!layout) {
          return null;
        }

        const glyphX = layout.glyphX;
        const glyphY = layout.glyphY;
        const labelX = layout.labelX;
        const labelY = layout.labelY;
        const active = hoveredPointId === point.id || selectedPointId === point.id;
        const scale = selectedPointId === point.id && panelOpen ? 1.15 : hoveredPointId === point.id ? 1.1 : 1;
        const glow =
          selectedPointId === point.id && panelOpen
            ? "url(#planet-hover-glow)"
            : hoveredPointId === point.id
              ? "url(#planet-hover-glow)"
              : "url(#planet-glow)";
        const textColor = "#ffffff";
        const partOfHighlightedAspect =
          highlightedAspect && (highlightedAspect[0] === point.id || highlightedAspect[1] === point.id);
        const opacity = panelOpen && selectedPointId
          ? selectedPointId === point.id || partOfHighlightedAspect
            ? 1
            : 0.6
          : 1;
        const tooltip = dictionary.result.points[point.id];
        const tangentX = -Math.sin(layout.angle);
        const tangentY = Math.cos(layout.angle);
        const rxX = labelX + tangentX * 20;
        const rxY = labelY + tangentY * -3;
        const labelAnchor = tangentX >= 0 ? "start" : "end";

        return (
          <g
            key={`astroseek-${point.id}`}
            data-chart-point={point.id}
            transform={scale !== 1 ? pointScaleTransform(glyphX, glyphY, scale) : undefined}
            onClick={() => onSelect(point.id, {
              id: point.id,
              xPercent: (glyphX / SIZE) * 100,
              yPercent: (glyphY / SIZE) * 100,
              content: tooltip,
            })}
            onMouseEnter={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onMouseLeave={() => onHover(null, null)}
            onFocus={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onBlur={() => onHover(null, null)}
            role="button"
            aria-label={tooltip}
            tabIndex={0}
            style={{ cursor: "pointer", opacity }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(point.id, {
                  id: point.id,
                  xPercent: (glyphX / SIZE) * 100,
                  yPercent: (glyphY / SIZE) * 100,
                  content: tooltip,
                });
              }
            }}
          >
            {active && (
              <circle
                cx={round(glyphX)}
                cy={round(glyphY)}
                r={20}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
            )}

            <text
              x={round(glyphX)}
              y={round(glyphY)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={textColor}
              fillOpacity="1"
              fontSize="24"
              fontWeight="500"
              style={{ filter: glow }}
            >
              {point.glyph}
            </text>

            {active ? (
              <g>
              <rect
                x={round(layout.labelX - 24)}
                y={round(layout.labelY - 9)}
                width={48}
                height={18}
                rx={9}
                fill="rgba(6,3,16,0.82)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={0.6}
              />
              <text
                x={round(labelX)}
                y={round(labelY)}
                textAnchor={labelAnchor}
                dominantBaseline="central"
                fill="rgba(190,163,210,0.75)"
                fontFamily="'Inter', sans-serif"
                fontSize="10"
                fontWeight="500"
                letterSpacing="0.02em"
              >
                {String(point.degreeInSign).padStart(2, "0")}° {String(point.minutesInSign).padStart(2, "0")}&apos;
              </text>
              </g>
            ) : null}

            {point.retrograde && active ? (
              <text
                x={round(rxX)}
                y={round(rxY)}
                textAnchor={labelAnchor}
                dominantBaseline="central"
                fill="rgba(232,197,71,0.9)"
                fontFamily="'Spectral', serif"
                fontSize="10"
                fontWeight="400"
              >
                ?
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

function ClearPlanetLayer({
  points,
  houses,
  aspects,
  dictionary,
  ascendant,
  selectedPointId,
  hoveredPointId,
  panelOpen,
  showDegrees,
  hoveredAspectId,
  hoveredAspectVisualId,
  selectedAspectId,
  onSelect,
  onHover,
  onHoverAspect,
  onClickAspect,
}: {
  points: ChartPoint[];
  houses: HouseCusp[];
  aspects: Aspect[];
  dictionary: Dictionary;
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  hoveredAspectVisualId: string | null;
  selectedAspectId: string | null;
  onSelect: (pointId: ChartPointId, tooltip?: TooltipState) => void;
  onHover: (tooltip: TooltipState | null, pointId?: ChartPointId | null) => void;
  onHoverAspect: (tooltip: TooltipState | null, aspectId?: string | null) => void;
  onClickAspect: (aspect: Aspect) => void;
}) {
  const highlightedAspect = hoveredAspectId ? hoveredAspectId.split("-") : null;
  const connectedPointIds = new Set<ChartPointId>();
  if (selectedPointId) {
    connectedPointIds.add(selectedPointId);
    aspects.forEach((aspect) => {
      if (aspect.from === selectedPointId) connectedPointIds.add(aspect.to);
      if (aspect.to === selectedPointId) connectedPointIds.add(aspect.from);
    });
  }
  const clusters: ChartPoint[][] = [];
  const sortedPoints = [...points].sort((left, right) => left.longitude - right.longitude);
  let currentCluster: ChartPoint[] = [];

  for (const point of sortedPoints) {
    const previous = currentCluster[currentCluster.length - 1];

    if (!previous || circularDistance(previous.longitude, point.longitude) <= PLANET_CLUSTER_THRESHOLD_DEGREES) {
      currentCluster.push(point);
      continue;
    }

    clusters.push(currentCluster);
    currentCluster = [point];
  }

  if (currentCluster.length) {
    const firstCluster = clusters[0]?.[0];
    const lastCluster = currentCluster[currentCluster.length - 1];

    if (
      clusters.length > 0 &&
      firstCluster &&
      lastCluster &&
      circularDistance(firstCluster.longitude, lastCluster.longitude) <= PLANET_CLUSTER_THRESHOLD_DEGREES
    ) {
      clusters[0] = [...currentCluster, ...clusters[0]];
    } else {
      clusters.push(currentCluster);
    }
  }

  const pointLayouts = new Map<ChartPointId, ClearPointLayout>();
  const pointsById = new Map(points.map((point) => [point.id, point] as const));

  clusters.forEach((cluster) => {
    const sortedCluster = [...cluster].sort((left, right) => left.longitude - right.longitude);

    const conflictGroups: ChartPoint[][] = [];
    let subGroup: ChartPoint[] = [sortedCluster[0]];
    for (let i = 1; i < sortedCluster.length; i++) {
      if (circularDistance(sortedCluster[i - 1].longitude, sortedCluster[i].longitude) < PLANET_CONFLICT_DEGREES) {
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
      conflictGroup.forEach((point, index) => {
        const rawFanLongitude = isClustered
          ? centerLongitude + (index - centerIndex) * PLANET_CLUSTER_FAN_STEP
          : point.longitude;
        const fanLongitude = normalizeLongitude(rawFanLongitude);
        const angle = pointAngle(fanLongitude, ascendant);
        const desiredGlyphRadius = isClustered ? PLANET_CLUSTER_CALLOUT_RADIUS : PLANET_LABEL_RADIUS;
        const glyphRadius = radiusInsideChart(desiredGlyphRadius, angle);
        const [glyphX, glyphY] = pointAtRadius(glyphRadius, fanLongitude, ascendant);

        pointLayouts.set(point.id, {
          glyphX,
          glyphY,
          visualLongitude: normalizeLongitude(fanLongitude),
          labelX: glyphX,
          labelY: glyphY + 18,
          labelAnchor: "middle",
          retrogradeX: glyphX,
          retrogradeY: glyphY + 42,
          connectorX1: glyphX,
          connectorY1: glyphY,
          connectorX2: glyphX,
          connectorY2: glyphY,
          hasConnector: false,
          isClustered,
          clusterPointIds,
        });
      });
    });
  });

  return (
    <>
      <SymbolicAspects
        aspects={aspects}
        pointsById={pointsById}
        pointLayouts={pointLayouts}
        dictionary={dictionary}
        ascendant={ascendant}
        activePointId={selectedPointId}
        hoveredPointId={hoveredPointId}
        highlightedAspectId={hoveredAspectId}
        hoveredAspectId={hoveredAspectVisualId}
        selectedAspectId={selectedAspectId}
        onHoverAspect={onHoverAspect}
        onClickAspect={onClickAspect}
      />
      {points.map((point) => {
        const layout = pointLayouts.get(point.id);
        if (!layout) {
          return null;
        }

        const active = hoveredPointId === point.id || selectedPointId === point.id;
        const clusterActive = layout.clusterPointIds.some((pointId) => pointId === hoveredPointId || pointId === selectedPointId);
        const scale = selectedPointId === point.id && panelOpen ? 1.15 : hoveredPointId === point.id ? 1.1 : 1;
        const glow =
          selectedPointId === point.id && panelOpen
            ? "url(#planet-hover-glow)"
            : hoveredPointId === point.id
              ? "url(#planet-hover-glow)"
              : "url(#planet-glow)";
        const partOfHighlightedAspect =
          highlightedAspect && (highlightedAspect[0] === point.id || highlightedAspect[1] === point.id);
        const pointFocusVisible = !selectedPointId || connectedPointIds.has(point.id) || Boolean(partOfHighlightedAspect);
        if (!pointFocusVisible) {
          return null;
        }
        const opacity = 1;
        const tooltip = dictionary.result.points[point.id];

        return (
          <g
            key={`clear-point-${point.id}`}
            data-chart-point={point.id}
            transform={scale !== 1 ? pointScaleTransform(layout.glyphX, layout.glyphY, scale) : undefined}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(point.id, {
                id: point.id,
                xPercent: (layout.glyphX / SIZE) * 100,
                yPercent: (layout.glyphY / SIZE) * 100,
                content: tooltip,
              });
            }}
            onMouseEnter={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (layout.glyphX / SIZE) * 100,
                  yPercent: (layout.glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onMouseLeave={() => onHover(null, null)}
            onFocus={() =>
              onHover(
                {
                  id: point.id,
                  xPercent: (layout.glyphX / SIZE) * 100,
                  yPercent: (layout.glyphY / SIZE) * 100,
                  content: tooltip,
                },
                point.id,
              )
            }
            onBlur={() => onHover(null, null)}
            role="button"
            aria-label={tooltip}
            tabIndex={0}
            style={{ cursor: "pointer", opacity }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(point.id, {
                  id: point.id,
                  xPercent: (layout.glyphX / SIZE) * 100,
                  yPercent: (layout.glyphY / SIZE) * 100,
                  content: tooltip,
                });
              }
            }}
          >
            {layout.hasConnector ? (
              <>
                <line
                  x1={round(layout.connectorX1)}
                  y1={round(layout.connectorY1)}
                  x2={round(layout.connectorX2)}
                  y2={round(layout.connectorY2)}
                  stroke={active ? "rgba(245,215,130,0.96)" : clusterActive ? "rgba(245,215,130,0.7)" : "rgba(220,45,45,0.92)"}
                  strokeWidth={active ? 3 : clusterActive ? 2.1 : 2}
                  strokeLinecap="round"
                />
              </>
            ) : null}

            {active ? (
              <circle
                cx={round(layout.glyphX)}
                cy={round(layout.glyphY)}
                r={29}
                fill="rgba(0,102,255,0.08)"
                stroke="rgba(245,215,130,0.7)"
                strokeOpacity="0.8"
                strokeWidth={1.2}
                filter="url(#planet-hover-glow)"
              />
            ) : null}

            {selectedPointId && connectedPointIds.has(point.id) && !active ? (
              <circle
                cx={round(layout.glyphX)}
                cy={round(layout.glyphY)}
                r={point.id === selectedPointId ? 31 : 24}
                fill="none"
                stroke={point.id === selectedPointId ? "rgba(245,215,130,0.82)" : "rgba(124,191,255,0.46)"}
                strokeWidth={point.id === selectedPointId ? 1.5 : 1}
                filter="url(#planet-hover-glow)"
              />
            ) : null}

            <text
              x={round(layout.glyphX + planetGlyphOffset(point.id).x)}
              y={round(layout.glyphY + planetGlyphOffset(point.id).y)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={planetGlyphInk(point.id)}
              fillOpacity="1"
              fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
              fontSize="38"
              fontWeight="700"
              stroke="#fffdf8"
              strokeWidth={1.35}
              paintOrder="stroke fill"
              style={{ filter: glow }}
            >
              {POINT_SYMBOLS[point.id] ?? POINT_GLYPHS[point.id] ?? point.glyph}
            </text>

            {showDegrees ? (
              <>
                <text
                  x={round(layout.glyphX + ((CX - layout.glyphX) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 40)}
                  y={round(layout.glyphY + ((CY - layout.glyphY) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 40)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#061331"
                  fontFamily="'Inter', sans-serif"
                  fontSize="19"
                  fontWeight="800"
                  letterSpacing="0"
                  stroke="#fffdf8"
                  strokeWidth={2.2}
                  paintOrder="stroke fill"
                >
                  {String(point.degreeInSign).padStart(2, "0")}°
                </text>
                <text
                  x={round(layout.glyphX + ((CX - layout.glyphX) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 72)}
                  y={round(layout.glyphY + ((CY - layout.glyphY) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 72)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={planetGlyphInk(point.id)}
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize="14"
                  fontWeight="800"
                  stroke="#fffdf8"
                  strokeWidth={1.9}
                  paintOrder="stroke fill"
                >
                  {pointSignGlyph(point)}
                </text>
                <text
                  x={round(layout.glyphX + ((CX - layout.glyphX) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 94)}
                  y={round(layout.glyphY + ((CY - layout.glyphY) / (Math.hypot(layout.glyphX - CX, layout.glyphY - CY) || 1)) * 94)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#061331"
                  fontFamily="'Inter', sans-serif"
                  fontSize="10.5"
                  fontWeight="800"
                  stroke="#fffdf8"
                  strokeWidth={1.8}
                  paintOrder="stroke fill"
                >
                  {String(point.minutesInSign).padStart(2, "0")}'
                </text>
              </>
            ) : null}

            {false ? (
              <text
                x={round(layout?.labelX ?? 0)}
                y={round(layout?.labelY ?? 0)}
                textAnchor={layout?.labelAnchor ?? "middle"}
                dominantBaseline="central"
                fill="#061331"
                fontFamily="'Inter', sans-serif"
                fontSize="10.5"
                fontWeight="700"
                letterSpacing="0.01em"
                stroke="#fffdf8"
                strokeWidth={2}
                paintOrder="stroke fill"
              >
                {String(point.degreeInSign).padStart(2, "0")}°{String(point.minutesInSign).padStart(2, "0")}&apos;
                </text>
            ) : null}

            {point.retrograde && active ? (
              <text
                x={round(layout.retrogradeX)}
                y={round(layout.retrogradeY)}
                textAnchor={layout.labelAnchor}
                dominantBaseline="central"
                fill="#082a78"
                fontFamily="'Spectral', serif"
                fontSize="10"
                fontWeight="600"
                stroke="#fffdf8"
                strokeWidth={1.8}
                paintOrder="stroke fill"
              >
                Rx
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

export function ChartLayerRail() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const {
    showAspects,
    showMinorAspects,
    showMinorPoints,
    showDegrees,
    toggleAspects,
    toggleMinorAspects,
    toggleMinorPoints,
    toggleDegrees,
  } = useChartStore();

  const controls = [
    {
      id: "major-aspects",
      label: dictionary.result.toggles.majorAspects,
      active: showAspects,
      onClick: toggleAspects,
    },
    {
      id: "minor-aspects",
      label: dictionary.result.toggles.minorAspects,
      active: showMinorAspects,
      onClick: toggleMinorAspects,
    },
    {
      id: "minor-points",
      label: dictionary.result.toggles.minorPoints,
      active: showMinorPoints,
      onClick: toggleMinorPoints,
    },
    {
      id: "degrees",
      label: dictionary.result.toggles.degrees,
      active: showDegrees,
      onClick: toggleDegrees,
    },
  ];
  return (
    <div className="sarita-chart-layer-rail flex w-full flex-wrap items-center justify-center gap-2 bg-transparent py-1">
      <p className="sr-only">
        {dictionary.result.toggles.view}
      </p>
      <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
        {controls.map((control) => (
          <button
            key={control.id}
            type="button"
            onClick={control.onClick}
            className={[
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-left transition focus-visible:outline-none",
              control.active
                ? "border-[#f5d782]/42 bg-[#f5d782]/12 text-[#fffaf0] shadow-[0_0_18px_rgba(245,215,130,0.08)]"
                : "border-[#d7e7ff]/16 bg-[#061331]/28 text-[#d7e7ff]/72",
            ].join(" ")}
            aria-pressed={control.active}
            aria-label={control.label}
          >
            <span
              aria-hidden="true"
              className={[
                "h-2.5 w-2.5 shrink-0 rounded-full",
                control.active
                  ? "bg-dusty-gold"
                  : "border border-dusty-gold/70 bg-dusty-gold/15",
              ].join(" ")}
            />
            <span
              className={[
                "whitespace-nowrap text-[9.5px] font-semibold uppercase leading-4 tracking-[0.12em] sm:text-[10px]",
                control.active ? "text-[#fffaf0]" : "text-[#d7e7ff]/72",
              ].join(" ")}
            >
              {control.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NatalChartWheel({ chart, viewerMode = false }: Props) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const {
    selectedPointId,
    selectedAspect,
    hoveredAspectId,
    panelOpen,
    showAspects,
    showMinorAspects,
    showMinorPoints,
    showDegrees,
    selectPoint,
    selectAspect,
    openPanel,
    closePanel,
  } = useChartStore();
  const [hoveredPointId, setHoveredPointId] = useState<ChartPointId | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredAspectVisualId, setHoveredAspectVisualId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1.45);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(viewerZoom);

  const ascendant = chart.meta.ascendant;

  const displayPoints = useMemo(() => {
    const withDerived = getAugmentedChartPoints(chart);
    return withDerived.filter((point) => {
      if (showMinorPoints) {
        return true;
      }

      return !["northNode", "southNode", "chiron", "partOfFortune", "lilith"].includes(point.id);
    });
  }, [chart, showMinorPoints]);

  const displayChart = useMemo<NatalChartData>(
    () => ({
      ...chart,
      points: displayPoints,
    }),
    [chart, displayPoints],
  );

  const pointsById = useMemo(
    () => new Map(displayPoints.map((point) => [point.id, point] as const)),
    [displayPoints],
  );

  const displayAspects = useMemo(
    () =>
      chart.aspects.filter((aspect) => {
        if (!pointsById.has(aspect.from) || !pointsById.has(aspect.to)) {
          return false;
        }

        const definition = getAspectDefinition(aspect.type);
        return definition.major ? showAspects : showMinorAspects;
      }),
    [chart.aspects, pointsById, showAspects, showMinorAspects],
  );

  useEffect(() => {
    if (!viewerOpen || viewerMode) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewerOpen, viewerMode]);

  function handleSelect(pointId: ChartPointId, _nextTooltip?: TooltipState) {
    setHoveredPointId(null);
    setHoveredAspectVisualId(null);
    setTooltip(null);
    if (selectedPointId === pointId) {
      closePanel();
      return;
    }
    selectPoint(pointId);
    openPanel();
  }

  function handlePointHover(nextTooltip: TooltipState | null, pointId: ChartPointId | null = null) {
    setTooltip(nextTooltip);
    setHoveredPointId(pointId);
    setHoveredAspectVisualId(null);
  }

  function handleAspectHover(nextTooltip: TooltipState | null, aspectId: string | null = null) {
    setTooltip(nextTooltip);
    setHoveredAspectVisualId(aspectId);
  }

  function handleAspectClick(aspect: Aspect) {
    selectAspect(selectedAspect?.id === aspect.id ? null : aspect);
  }

  function setClampedViewerZoom(next: number | ((current: number) => number)) {
    setViewerZoom((current) => clampViewerZoom(typeof next === "function" ? next(current) : next));
  }

  function handleViewerTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2) {
      return;
    }

    const distance = getTouchDistance(event.touches);

    if (!distance) {
      return;
    }

    pinchStartDistanceRef.current = distance;
    pinchStartZoomRef.current = viewerZoom;
  }

  function handleViewerTouchMove(event: TouchEvent<HTMLDivElement>) {
    const startDistance = pinchStartDistanceRef.current;

    if (event.touches.length !== 2 || !startDistance) {
      return;
    }

    const distance = getTouchDistance(event.touches);

    if (!distance) {
      return;
    }

    event.preventDefault();
    setClampedViewerZoom(pinchStartZoomRef.current * (distance / startDistance));
  }

  function handleViewerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) {
      const distance = getTouchDistance(event.touches);
      pinchStartDistanceRef.current = distance;
      pinchStartZoomRef.current = viewerZoom;
      return;
    }

    pinchStartDistanceRef.current = null;
  }

  const closeViewerLabel = locale === "en" ? "Close" : locale === "it" ? "Chiudi" : "Cerrar";
  const zoomInLabel = locale === "en" ? "Zoom in" : locale === "it" ? "Ingrandisci" : "Acercar";
  const zoomOutLabel = locale === "en" ? "Zoom out" : locale === "it" ? "Riduci" : "Alejar";
  const resetZoomLabel = locale === "en" ? "Reset" : locale === "it" ? "Ripristina" : "Reset";
  const openViewerLabel = locale === "en" ? "Open chart viewer" : locale === "it" ? "Apri carta" : "Ampliar carta";
  const viewer =
    !viewerMode && viewerOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[10050] bg-[#030814]/96 text-[#fffdf8] backdrop-blur-xl">
            <div className="flex h-[calc(env(safe-area-inset-top)+3.7rem)] items-end justify-between px-4 pb-3">
              <button
                type="button"
                onClick={() => setViewerOpen(false)}
                className="sarita-floating-mark flex h-11 w-11 items-center justify-center rounded-full text-2xl"
                aria-label={closeViewerLabel}
              >
                {"\u00d7"}
              </button>
              <div className="flex items-center gap-2 rounded-full border border-[#d7e7ff]/16 bg-[#061331]/72 p-1 shadow-[0_0_28px_rgba(0,102,255,0.16)]">
                <button
                  type="button"
                  onClick={() => setClampedViewerZoom((current) => current - 0.18)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#e8f3ff]"
                  aria-label={zoomOutLabel}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setClampedViewerZoom(1.45)}
                  className="h-9 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f5d782]"
                >
                  {resetZoomLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setClampedViewerZoom((current) => current + 0.18)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#e8f3ff]"
                  aria-label={zoomInLabel}
                >
                  +
                </button>
              </div>
            </div>
            <div
              className="h-[calc(100svh-env(safe-area-inset-top)-3.7rem)] overflow-auto px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-6 [-webkit-overflow-scrolling:touch]"
              onTouchStart={handleViewerTouchStart}
              onTouchMove={handleViewerTouchMove}
              onTouchEnd={handleViewerTouchEnd}
              onTouchCancel={handleViewerTouchEnd}
            >
              <div
                className="mx-auto"
                style={{
                  width: `${Math.round(88 * viewerZoom)}vmin`,
                  minWidth: `${Math.round(88 * viewerZoom)}vmin`,
                }}
              >
                <NatalChartWheel chart={chart} viewerMode />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={[
        "relative aspect-square w-[min(100%,calc(100vw-1.5rem))] max-w-[58rem] rounded-full bg-transparent drop-shadow-[0_18px_42px_rgba(30,26,46,0.18)] lg:w-[760px] xl:w-[820px]",
        viewerMode ? "w-full max-w-none lg:w-full" : "",
        !viewerMode ? "mb-28 sm:mb-32" : "",
      ].join(" ")}
    >
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-30 hidden -translate-x-1/2 -translate-y-[calc(100%+0.85rem)] rounded-2xl border border-dusty-gold/45 bg-[#fffaf0] px-3 py-2 text-xs font-semibold leading-6 text-[#1e1a2e] shadow-[0_18px_45px_rgba(0,0,0,0.28)] md:block"
          style={{ left: `${tooltip.xPercent}%`, top: `${tooltip.yPercent}%` }}
        >
          {tooltip.content}
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative h-full w-full overflow-visible"
        role="img"
        aria-label="Carta natal interactiva"
        onClick={() => {
          if (selectedPointId) {
            closePanel();
          }
        }}
      >
        <defs>
          <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,250,240,0.36)" />
            <stop offset="55%" stopColor="rgba(138,122,78,0.05)" />
            <stop offset="100%" stopColor="rgba(30,26,46,0.06)" />
          </radialGradient>
          <radialGradient id="chart-surface-bg" cx="50%" cy="45%" r="56%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="52%" stopColor="#f4f7ff" />
            <stop offset="100%" stopColor="#dce8f8" />
          </radialGradient>
          <filter id="planet-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planet-hover-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="aspect-neon-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <>
            <circle cx={CX} cy={CY} r={CX - 8} fill="url(#chart-surface-bg)" stroke="rgba(124,191,255,0.26)" strokeWidth="1.4" filter="url(#planet-glow)" />
            <circle cx={CX} cy={CY} r={CX - 22} fill="none" stroke="rgba(245,215,130,0.15)" strokeWidth="10" />
            <circle cx={CX} cy={CY} r={ZODIAC_INNER} fill="url(#wheel-bg)" />
            <SymbolicWheelFrame ascendant={ascendant} />
            <TickRing ascendant={ascendant} showDegrees={showDegrees} points={displayPoints} />
            <HouseGeometry chart={displayChart} ascendant={ascendant} />
            <AxisLines chart={displayChart} ascendant={ascendant} />
            <circle cx={CX} cy={CY} r={12} fill="none" stroke="rgba(181,163,110,0.5)" strokeWidth={0.5} />

            <ClearPlanetLayer
              points={displayPoints}
              houses={chart.houses}
              aspects={displayAspects}
              dictionary={dictionary}
              ascendant={ascendant}
              selectedPointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              panelOpen={panelOpen}
              showDegrees={showDegrees}
              hoveredAspectId={hoveredAspectId}
              hoveredAspectVisualId={hoveredAspectVisualId}
              selectedAspectId={selectedAspect?.id ?? null}
              onSelect={handleSelect}
              onHover={handlePointHover}
              onHoverAspect={handleAspectHover}
              onClickAspect={handleAspectClick}
            />
        </>
      </svg>
      {!viewerMode ? (
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="absolute -bottom-12 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#f5d782]/30 bg-[#030814]/72 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d782] shadow-[0_0_26px_rgba(0,102,255,0.2),0_0_22px_rgba(245,215,130,0.08)] backdrop-blur-md transition hover:border-[#f5d782]/55 sm:-bottom-14"
        >
          {openViewerLabel}
        </button>
      ) : null}
      {viewer}
    </div>
  );
}
