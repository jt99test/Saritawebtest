"use client";

import { useMemo, useState } from "react";

import {
  getAugmentedChartPoints,
  zodiacSigns,
  type Aspect,
  type AspectId,
  type ChartPoint,
  type ChartPointId,
  type NatalChartData,
} from "@/lib/chart";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";
import { useChartStore } from "@/components/chart/chart-store";

type Props = {
  chart: NatalChartData;
};

type TooltipState = {
  id: string;
  xPercent: number;
  yPercent: number;
  content: string;
};

const dictionary = dictionaries.es;

const SIZE = 860;
const CX = 430;
const CY = 430;

const ZODIAC_OUTER = 402;
const ZODIAC_INNER = 344;
const DEGREE_TICK_OUTER = 400;
const PLANET_RING_RADIUS = 286;
const PLANET_LABEL_RADIUS = 320;
const HOUSE_OUTER = 252;
const HOUSE_INNER = 142;
const HOUSE_NUMBER_RADIUS = 208;
const ASPECT_RADIUS = 134;

const SYMBOLIC_ASPECT_COLORS: Record<AspectId, string> = {
  conjunction: "rgba(220,195,120,0.95)",
  opposition: "rgba(220,110,110,0.85)",
  square: "rgba(220,110,110,0.85)",
  trine: "rgba(140,158,240,0.85)",
  sextile: "rgba(140,158,240,0.75)",
  quincunx: "rgba(200,200,215,0.55)",
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

const DISPLAY_ASPECTS: Array<{ type: AspectId; angle: number; orb: number; major: boolean }> = [
  { type: "conjunction", angle: 0, orb: 8, major: true },
  { type: "sextile", angle: 60, orb: 5, major: true },
  { type: "square", angle: 90, orb: 7, major: true },
  { type: "trine", angle: 120, orb: 7, major: true },
  { type: "quincunx", angle: 150, orb: 3, major: false },
  { type: "opposition", angle: 180, orb: 8, major: true },
];

function pointAtRadius(radius: number, longitude: number, ascendant: number): [number, number] {
  const angle = ((180 + ascendant - longitude) * Math.PI) / 180;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function pointAngle(longitude: number, ascendant: number) {
  return ((180 + ascendant - longitude) * Math.PI) / 180;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function circularDistance(first: number, second: number) {
  const difference = Math.abs(first - second);
  return difference > 180 ? 360 - difference : difference;
}

function pointScaleTransform(x: number, y: number, scale: number) {
  return `translate(${round(x)} ${round(y)}) scale(${scale}) translate(${-round(x)} ${-round(y)})`;
}

function displayAspectOrb(definition: (typeof DISPLAY_ASPECTS)[number], first: ChartPoint, second: ChartPoint) {
  const hasLuminary = first.id === "sun" || first.id === "moon" || second.id === "sun" || second.id === "moon";
  if (!hasLuminary) return definition.orb;
  if (definition.type === "conjunction" || definition.type === "opposition") return 10;
  if (definition.type === "square" || definition.type === "trine") return 9;
  if (definition.type === "sextile") return 6;
  return definition.orb;
}

function detectDisplayAspects(points: ChartPoint[]) {
  const aspects: Aspect[] = [];

  for (let index = 0; index < points.length; index += 1) {
    for (let innerIndex = index + 1; innerIndex < points.length; innerIndex += 1) {
      const first = points[index]!;
      const second = points[innerIndex]!;
      const angle = circularDistance(first.longitude, second.longitude);

      for (const definition of DISPLAY_ASPECTS) {
        const orb = Math.abs(angle - definition.angle);

        if (orb <= displayAspectOrb(definition, first, second)) {
          aspects.push({
            id: `${first.id}-${second.id}-${definition.type}`,
            type: definition.type,
            from: first.id,
            to: second.id,
            orb: Math.round(orb * 10) / 10,
          });
          break;
        }
      }
    }
  }

  return aspects;
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

function TickRing({
  ascendant,
  showDegrees,
  points,
}: {
  ascendant: number;
  showDegrees: boolean;
  points: ChartPoint[];
}) {
  const marks = [];
  const labels = [];

  for (let signIndex = 0; signIndex < 12; signIndex += 1) {
    const signStart = signIndex * 30;

    for (let degree = 0; degree < 30; degree += 1) {
      const longitude = signStart + degree;
      const isFifteen = degree === 15;
      const isLabelDegree = degree === 0 || isFifteen;
      const isFive = degree % 5 === 0 && !isLabelDegree;
      const innerRadius = isLabelDegree ? 328 : isFive ? 334 : 338;
      const [x1, y1] = pointAtRadius(DEGREE_TICK_OUTER, longitude, ascendant);
      const [x2, y2] = pointAtRadius(innerRadius, longitude, ascendant);

      marks.push(
        <line
          key={`tick-${longitude}`}
          x1={round(x1)}
          y1={round(y1)}
          x2={round(x2)}
          y2={round(y2)}
          stroke={
            isLabelDegree
              ? "rgba(30,26,46,0.38)"
              : isFive
                ? "rgba(30,26,46,0.24)"
                : "rgba(30,26,46,0.12)"
          }
          strokeWidth={isLabelDegree ? 0.9 : isFive ? 0.7 : 0.48}
        />,
      );

      if (showDegrees && isLabelDegree) {
        const hasNearbyPlanet = points.some((point) => circularDistance(point.longitude, longitude) <= 3);

        if (hasNearbyPlanet) {
          continue;
        }

        const [labelX, labelY] = pointAtRadius(321, longitude + 1.2, ascendant);
        labels.push(
          <g key={`degree-label-${longitude}`}>
            <circle cx={round(labelX)} cy={round(labelY)} r="8" fill="rgba(255,250,240,0.72)" />
            <text
              x={round(labelX)}
              y={round(labelY)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(30,26,46,0.82)"
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
      <g>{marks}</g>
      {showDegrees ? <g>{labels}</g> : null}
    </>
  );
}

function SymbolicWheelFrame({ ascendant }: { ascendant: number }) {
  const elementTints = {
    fire: "rgba(209,118,118,0.14)",
    earth: "rgba(216,194,122,0.1)",
    air: "rgba(140,158,240,0.1)",
    water: "rgba(110,170,190,0.12)",
  } as const;

  return (
    <>
      {zodiacSigns.map((sign) => (
        <path
          key={`tint-${sign.id}`}
          d={describeRingSegment(ZODIAC_INNER, ZODIAC_OUTER, sign.start, sign.start + 30, ascendant)}
          fill={elementTints[sign.element]}
          stroke="rgba(30,26,46,0.18)"
          strokeWidth="1"
        />
      ))}

      <circle cx={CX} cy={CY} r={ZODIAC_OUTER + 2} fill="none" stroke="rgba(30,26,46,0.38)" strokeWidth="1.2" />
      <circle cx={CX} cy={CY} r={ZODIAC_OUTER - 12} fill="none" stroke="rgba(30,26,46,0.14)" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER + 12} fill="none" stroke="rgba(30,26,46,0.14)" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER} fill="none" stroke="rgba(30,26,46,0.42)" strokeWidth="1.2" />
      <circle cx={CX} cy={CY} r={HOUSE_OUTER} fill="none" stroke="rgba(30,26,46,0.12)" strokeWidth="0.9" />
      <circle cx={CX} cy={CY} r={HOUSE_INNER} fill="none" stroke="rgba(30,26,46,0.1)" strokeWidth="0.8" />

      {zodiacSigns.map((sign) => {
        const [x, y] = pointAtRadius((ZODIAC_OUTER + ZODIAC_INNER) / 2, sign.start + 15, ascendant);
        return (
          <text
            key={`sign-glyph-${sign.id}`}
            x={round(x)}
            y={round(y)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1e1a2e"
            fillOpacity="0.58"
            fontSize="22"
            fontWeight="600"
            fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
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
            stroke="rgba(30,26,46,0.28)"
            strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? 1.6 : 0.9}
          />
        );
      })}

      {chart.houses.map((house, index) => {
        const current = house.longitude;
        const next = chart.houses[(index + 1) % 12]!.longitude;
        const midpoint = current + ((next - current + 360) % 360) / 2;
        const [x, y] = pointAtRadius(HOUSE_NUMBER_RADIUS, midpoint, ascendant);

        return (
          <text
            key={`house-number-${house.house}`}
            x={round(x)}
            y={round(y)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(30,26,46,0.52)"
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
              stroke="rgba(30,26,46,0.72)"
              strokeWidth={axis.weight}
            />
            <g transform={`translate(${round(labelStartX)} ${round(labelStartY)})`}>
              <rect
                x={-20}
                y={-11}
                width={40}
                height={22}
                rx={11}
                fill="#fffaf0"
                stroke="rgba(138,122,78,0.72)"
                strokeWidth="1"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#1e1a2e"
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
                fill="#fffaf0"
                stroke="rgba(138,122,78,0.72)"
                strokeWidth="1"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#1e1a2e"
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

function SymbolicAspects({
  aspects,
  pointsById,
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
  ascendant: number;
  activePointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  highlightedAspectId: string | null;
  hoveredAspectId: string | null;
  selectedAspectId: string | null;
  onHoverAspect: (tooltip: TooltipState | null, aspectId?: string | null) => void;
  onClickAspect: (aspect: Aspect) => void;
}) {
  const focusPointId = hoveredPointId ?? activePointId;

  return (
    <>
      {aspects.map((aspect) => {
        const fromPoint = pointsById.get(aspect.from);
        const toPoint = pointsById.get(aspect.to);

        if (!fromPoint || !toPoint) {
          return null;
        }

        const [x1, y1] = pointAtRadius(ASPECT_RADIUS, fromPoint.longitude, ascendant);
        const [x2, y2] = pointAtRadius(ASPECT_RADIUS, toPoint.longitude, ascendant);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const definition = getAspectDefinition(aspect.type);
        const focused = focusPointId ? aspect.from === focusPointId || aspect.to === focusPointId : true;
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
            onClick={() => onClickAspect(aspect)}
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
            />
            <text
              x={round(mx)}
              y={round(my)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={SYMBOLIC_ASPECT_COLORS[aspect.type]}
              fillOpacity={strokeOpacity * 1.2 > 1 ? 1 : strokeOpacity * 1.2}
              fontSize="11"
              fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', serif"
            >
              {ASPECT_SYMBOLS[aspect.type]}
            </text>
          </g>
        );
      })}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _PlanetLayer({
  points,
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
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  onSelect: (pointId: ChartPointId) => void;
  onHover: (tooltip: TooltipState | null, pointId?: ChartPointId | null) => void;
}) {
  const highlightedAspect = hoveredAspectId ? hoveredAspectId.split("-") : null;

  return (
    <>
      {points.map((point) => {
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
        const tooltip = `${dictionary.result.points[point.id]} - ${String(point.degreeInSign).padStart(2, "0")}° ${String(point.minutesInSign).padStart(2, "0")}'`;

        return (
          <g
            key={point.id}
            data-chart-point={point.id}
            transform={scale !== 1 ? pointScaleTransform(glyphX, glyphY, scale) : undefined}
            onClick={() => onSelect(point.id)}
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
                onSelect(point.id);
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
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  onSelect: (pointId: ChartPointId) => void;
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
        const tooltip = `${dictionary.result.points[point.id]} - ${String(point.degreeInSign).padStart(2, "0")}° ${String(point.minutesInSign).padStart(2, "0")}'`;
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
            onClick={() => onSelect(point.id)}
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
                onSelect(point.id);
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
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  showDegrees: boolean;
  hoveredAspectId: string | null;
  onSelect: (pointId: ChartPointId) => void;
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
      labelAnchor: "start" | "end";
      retrogradeX: number;
      retrogradeY: number;
      connectorX1: number;
      connectorY1: number;
      connectorX2: number;
      connectorY2: number;
      hasConnector: boolean;
    }
  >();

  clusters.forEach((cluster) => {
    const sortedCluster = [...cluster].sort((left, right) => left.longitude - right.longitude);
    const clusterCenter =
      sortedCluster.reduce((sum, point) => sum + point.longitude, 0) / sortedCluster.length;

    sortedCluster.forEach((point, index) => {
      const angle = pointAngle(clusterCenter, ascendant);
      const radialX = Math.cos(angle);
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const centeredIndex = index - (sortedCluster.length - 1) / 2;
      const tangentOffset = sortedCluster.length > 1 ? centeredIndex * 34 : 0;
      const stackPull = Math.abs(centeredIndex) * 4;
      const [connectorX1, connectorY1] = pointAtRadius(PLANET_LABEL_RADIUS + 2, point.longitude, ascendant);
      const [baseGlyphX, baseGlyphY] = pointAtRadius(PLANET_LABEL_RADIUS + 8 - stackPull, clusterCenter, ascendant);
      const glyphX = baseGlyphX + tangentX * tangentOffset;
      const glyphY = baseGlyphY + tangentY * tangentOffset;
      const labelSide = radialX >= 0 ? 1 : -1;
      const labelX = glyphX + labelSide * 28;
      const labelY = glyphY + 10;
      const labelAnchor = labelSide > 0 ? "start" : "end";

      pointLayouts.set(point.id, {
        glyphX,
        glyphY,
        labelX,
        labelY,
        labelAnchor,
        retrogradeX: glyphX + labelSide * 28,
        retrogradeY: glyphY - 10,
        connectorX1,
        connectorY1,
        connectorX2: glyphX,
        connectorY2: glyphY,
        hasConnector: sortedCluster.length > 1 || Math.abs(point.longitude - clusterCenter) > 1,
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

        const active = hoveredPointId === point.id || selectedPointId === point.id;
        const scale = selectedPointId === point.id && panelOpen ? 1.15 : hoveredPointId === point.id ? 1.1 : 1;
        const glow =
          selectedPointId === point.id && panelOpen
            ? "url(#planet-hover-glow)"
            : hoveredPointId === point.id
              ? "url(#planet-hover-glow)"
              : "url(#planet-glow)";
        const partOfHighlightedAspect =
          highlightedAspect && (highlightedAspect[0] === point.id || highlightedAspect[1] === point.id);
        const opacity = panelOpen && selectedPointId
          ? selectedPointId === point.id || partOfHighlightedAspect
            ? 1
            : 0.6
          : 1;
        const tooltip = `${dictionary.result.points[point.id]} - ${String(point.degreeInSign).padStart(2, "0")}° ${String(point.minutesInSign).padStart(2, "0")}'`;

        return (
          <g
            key={`clear-point-${point.id}`}
            data-chart-point={point.id}
            transform={scale !== 1 ? pointScaleTransform(layout.glyphX, layout.glyphY, scale) : undefined}
            onClick={() => onSelect(point.id)}
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
                onSelect(point.id);
              }
            }}
          >
            {layout.hasConnector ? (
              <line
                x1={round(layout.connectorX1)}
                y1={round(layout.connectorY1)}
                x2={round(layout.connectorX2)}
                y2={round(layout.connectorY2)}
                stroke="rgba(30,26,46,0.18)"
                strokeWidth={0.55}
                strokeLinecap="round"
              />
            ) : null}

            {active ? (
              <circle
                cx={round(layout.glyphX)}
                cy={round(layout.glyphY)}
                r={29}
                fill="rgba(232,197,71,0.08)"
                stroke={point.color}
                strokeOpacity="0.55"
                strokeWidth={1.2}
              />
            ) : null}

            <circle
              cx={round(layout.glyphX)}
              cy={round(layout.glyphY)}
              r={20}
              fill="#fffaf0"
              stroke="rgba(138,122,78,0.42)"
              strokeWidth={0.8}
            />

            <text
              x={round(layout.glyphX)}
              y={round(layout.glyphY)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={point.color}
              fillOpacity="1"
              fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
              fontSize="27"
              fontWeight="700"
              stroke="#fffaf0"
              strokeWidth={1.6}
              paintOrder="stroke fill"
              style={{ filter: glow }}
            >
              {POINT_SYMBOLS[point.id] ?? POINT_GLYPHS[point.id] ?? point.glyph}
            </text>

            {active ? (
              <text
                x={round(layout.labelX)}
                y={round(layout.labelY)}
                textAnchor={layout.labelAnchor}
                dominantBaseline="central"
                fill="#1e1a2e"
                fontFamily="'Inter', sans-serif"
                fontSize="10.5"
                fontWeight="700"
                letterSpacing="0.01em"
                stroke="#fffaf0"
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
                fill="#8a7a4e"
                fontFamily="'Spectral', serif"
                fontSize="10"
                fontWeight="600"
                stroke="#fffaf0"
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
    <div className="mx-auto flex w-full max-w-[34rem] flex-col border border-black/12 bg-white/85 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:mx-0 lg:w-auto lg:min-w-[12rem]">
      <p className="mb-3 text-center font-serif text-[14px] italic lowercase tracking-[0.15em] text-[#6f613a] lg:text-left">
        vista
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:flex lg:flex-col lg:gap-3">
        {controls.map((control) => (
          <button
            key={control.id}
            type="button"
            onClick={control.onClick}
            className="flex items-center gap-3 py-1 text-left transition focus-visible:outline-none"
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
                "text-[13px] font-semibold leading-5",
                control.active ? "text-ivory" : "text-[#3a3048]",
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

export function NatalChartWheel({ chart }: Props) {
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
  } = useChartStore();
  const [hoveredPointId, setHoveredPointId] = useState<ChartPointId | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredAspectVisualId, setHoveredAspectVisualId] = useState<string | null>(null);

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
      detectDisplayAspects(displayPoints).filter((aspect) => {
        const definition = getAspectDefinition(aspect.type);
        return definition.major ? showAspects : showMinorAspects;
      }),
    [displayPoints, showAspects, showMinorAspects],
  );

  function handleSelect(pointId: ChartPointId) {
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
    selectAspect(aspect);
  }

  return (
    <div className="relative aspect-square w-full max-w-[54rem] rounded-full bg-transparent drop-shadow-[0_18px_42px_rgba(30,26,46,0.18)] lg:w-[640px]">
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-30 hidden -translate-x-1/2 -translate-y-[calc(100%+0.85rem)] rounded-2xl border border-dusty-gold/45 bg-[#fffaf0] px-3 py-2 text-xs font-semibold leading-6 text-[#1e1a2e] shadow-[0_18px_45px_rgba(0,0,0,0.28)] md:block"
          style={{ left: `${tooltip.xPercent}%`, top: `${tooltip.yPercent}%` }}
        >
          {tooltip.content}
        </div>
      ) : null}

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative h-full w-full overflow-visible" role="img" aria-label="Carta natal interactiva">
        <defs>
          <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,250,240,0.36)" />
            <stop offset="55%" stopColor="rgba(138,122,78,0.05)" />
            <stop offset="100%" stopColor="rgba(30,26,46,0.06)" />
          </radialGradient>
          <radialGradient id="chart-surface-bg" cx="50%" cy="45%" r="56%">
            <stop offset="0%" stopColor="#f5f0e6" />
            <stop offset="68%" stopColor="#ede7d9" />
            <stop offset="100%" stopColor="#ddd6c6" />
          </radialGradient>
          <filter id="planet-glow">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planet-hover-glow">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <>
            <circle cx={CX} cy={CY} r={CX - 8} fill="url(#chart-surface-bg)" stroke="rgba(30,26,46,0.16)" strokeWidth="1.2" />
            <circle cx={CX} cy={CY} r={CX - 22} fill="none" stroke="rgba(138,122,78,0.1)" strokeWidth="10" />
            <circle cx={CX} cy={CY} r={ZODIAC_INNER} fill="url(#wheel-bg)" />
            <SymbolicWheelFrame ascendant={ascendant} />
            <TickRing ascendant={ascendant} showDegrees={showDegrees} points={displayPoints} />
            <HouseGeometry chart={displayChart} ascendant={ascendant} />
            <AxisLines chart={displayChart} ascendant={ascendant} />
            <SymbolicAspects
              aspects={displayAspects}
              pointsById={pointsById}
              ascendant={ascendant}
              activePointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              highlightedAspectId={hoveredAspectId}
              hoveredAspectId={hoveredAspectVisualId}
              selectedAspectId={selectedAspect?.id ?? null}
              onHoverAspect={handleAspectHover}
              onClickAspect={handleAspectClick}
            />

            <circle cx={CX} cy={CY} r={12} fill="none" stroke="rgba(181,163,110,0.5)" strokeWidth={0.5} />

            <ClearPlanetLayer
              points={displayPoints}
              ascendant={ascendant}
              selectedPointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              panelOpen={panelOpen}
              showDegrees={showDegrees}
              hoveredAspectId={hoveredAspectId}
              onSelect={handleSelect}
              onHover={handlePointHover}
            />
        </>
      </svg>
    </div>
  );
}

