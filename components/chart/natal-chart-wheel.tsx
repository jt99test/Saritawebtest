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
import { useChartStore } from "@/components/chart/chart-store";

type Props = {
  chart: NatalChartData;
  variant?: "default" | "astronomical" | "symbolic";
};

const SIZE = 860;
const CX = 430;
const CY = 430;

const ZODIAC_OUTER = 402;
const ZODIAC_INNER = 344;
const DEGREE_TICK_OUTER = 400;
const PLANET_RING_RADIUS = 286;
const PLANET_LABEL_RADIUS = 312;
const HOUSE_OUTER = 252;
const HOUSE_INNER = 142;
const HOUSE_NUMBER_RADIUS = 208;
const ASPECT_RADIUS = 134;
const CENTER_GLOW_RADIUS = 58;

const SYMBOLIC_ASPECT_COLORS: Record<AspectId, string> = {
  conjunction: "#e8c547",
  opposition: "#ff4d6d",
  square: "#ff4d6d",
  trine: "#4d9aff",
  sextile: "#4d9aff",
  quincunx: "rgba(214,214,222,0.65)",
};

const DISPLAY_ASPECTS: Array<{ type: AspectId; angle: number; orb: number }> = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 5 },
  { type: "square", angle: 90, orb: 7 },
  { type: "trine", angle: 120, orb: 7 },
  { type: "quincunx", angle: 150, orb: 3 },
  { type: "opposition", angle: 180, orb: 8 },
];

const STARFIELD = Array.from({ length: 150 }, (_, index) => {
  const seedA = Math.sin(index * 91.173 + 0.42) * 43758.5453;
  const seedB = Math.sin(index * 53.917 + 1.91) * 12741.371;
  const seedC = Math.sin(index * 17.417 + 4.13) * 83421.113;
  const x = (seedA - Math.floor(seedA)) * SIZE;
  const y = (seedB - Math.floor(seedB)) * SIZE;
  const radius = 0.6 + ((seedC - Math.floor(seedC)) * 1.7);
  const opacity = 0.2 + (((seedA + seedB) % 1 + 1) % 1) * 0.6;

  return { x, y, radius, opacity };
});

function pointAtRadius(radius: number, longitude: number, ascendant: number): [number, number] {
  const angle = ((180 + ascendant - longitude) * Math.PI) / 180;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
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

function normalizeOpacity(orb: number, maxOrb: number) {
  const ratio = Math.max(0, Math.min(1, 1 - orb / maxOrb));
  return 0.22 + ratio * 0.68;
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

        if (orb <= definition.orb) {
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

function TickRing({ ascendant }: { ascendant: number }) {
  const marks = [];
  const labels = [];

  for (let signIndex = 0; signIndex < 12; signIndex += 1) {
    const signStart = signIndex * 30;

    for (let degree = 0; degree < 30; degree += 1) {
      const longitude = signStart + degree;
      const isTen = degree % 10 === 0;
      const isFive = degree % 5 === 0 && !isTen;
      const innerRadius = isTen ? 328 : isFive ? 334 : 338;
      const [x1, y1] = pointAtRadius(DEGREE_TICK_OUTER, longitude, ascendant);
      const [x2, y2] = pointAtRadius(innerRadius, longitude, ascendant);

      marks.push(
        <line
          key={`tick-${longitude}`}
          x1={round(x1)}
          y1={round(y1)}
          x2={round(x2)}
          y2={round(y2)}
          stroke={isTen ? "rgba(236,228,255,0.6)" : isFive ? "rgba(236,228,255,0.34)" : "rgba(236,228,255,0.18)"}
          strokeWidth={isTen ? 1.05 : isFive ? 0.82 : 0.58}
        />,
      );

      if (isTen) {
        const [labelX, labelY] = pointAtRadius(319, longitude + 1.2, ascendant);
        labels.push(
          <text
            key={`degree-label-${longitude}`}
            x={round(labelX)}
            y={round(labelY)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(236,228,255,0.66)"
            fontFamily="'Inter', sans-serif"
            fontSize="10"
            letterSpacing="0.03em"
          >
            {degree}
          </text>,
        );
      }
    }
  }

  return (
    <>
      <g>{marks}</g>
      <g>{labels}</g>
    </>
  );
}

function SymbolicWheelFrame({ ascendant }: { ascendant: number }) {
  const elementTints = {
    fire: "rgba(255,122,140,0.08)",
    earth: "rgba(116,172,122,0.08)",
    air: "rgba(135,188,255,0.08)",
    water: "rgba(146,104,222,0.08)",
  } as const;

  return (
    <>
      {zodiacSigns.map((sign) => (
        <path
          key={`tint-${sign.id}`}
          d={describeRingSegment(ZODIAC_INNER, ZODIAC_OUTER, sign.start, sign.start + 30, ascendant)}
          fill={elementTints[sign.element]}
          stroke="rgba(230,220,255,0.12)"
          strokeWidth="0.9"
        />
      ))}

      <circle cx={CX} cy={CY} r={ZODIAC_OUTER + 2} fill="none" stroke="rgba(230,220,255,0.24)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={ZODIAC_OUTER - 12} fill="none" stroke="rgba(230,220,255,0.1)" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER + 12} fill="none" stroke="rgba(230,220,255,0.1)" strokeWidth="0.7" />
      <circle cx={CX} cy={CY} r={ZODIAC_INNER} fill="none" stroke="rgba(230,220,255,0.25)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={HOUSE_OUTER} fill="rgba(8,6,18,0.26)" stroke="rgba(230,220,255,0.16)" strokeWidth="0.9" />
      <circle cx={CX} cy={CY} r={HOUSE_INNER} fill="rgba(8,5,16,0.16)" stroke="rgba(230,220,255,0.12)" strokeWidth="0.8" />

      {zodiacSigns.map((sign) => {
        const [x, y] = pointAtRadius((ZODIAC_OUTER + ZODIAC_INNER) / 2, sign.start + 15, ascendant);
        return (
          <text
            key={`sign-glyph-${sign.id}`}
            x={round(x)}
            y={round(y)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#d4c5f9"
            fontSize="24"
            fontWeight="500"
            style={{ filter: "url(#symbolic-sign-glow)" }}
          >
            {sign.glyph}
          </text>
        );
      })}
    </>
  );
}

function describeRingSegment(innerRadius: number, outerRadius: number, startLongitude: number, endLongitude: number, ascendant: number) {
  const [x1, y1] = pointAtRadius(outerRadius, startLongitude, ascendant);
  const [x2, y2] = pointAtRadius(outerRadius, endLongitude, ascendant);
  const [x3, y3] = pointAtRadius(innerRadius, endLongitude, ascendant);
  const [x4, y4] = pointAtRadius(innerRadius, startLongitude, ascendant);
  const largeArc = endLongitude - startLongitude > 180 ? 1 : 0;

  return `M${round(x1)},${round(y1)} A${outerRadius},${outerRadius},0,${largeArc},0,${round(x2)},${round(y2)} L${round(x3)},${round(y3)} A${innerRadius},${innerRadius},0,${largeArc},1,${round(x4)},${round(y4)} Z`;
}

function HouseGeometry({
  chart,
  ascendant,
}: {
  chart: NatalChartData;
  ascendant: number;
}) {
  return (
    <>
      {chart.houses.map((house) => {
        const [outerX, outerY] = pointAtRadius(HOUSE_OUTER, house.longitude, ascendant);
        const [innerX, innerY] = pointAtRadius(HOUSE_INNER, house.longitude, ascendant);
        return (
          <line
            key={`house-line-${house.house}`}
            x1={round(outerX)}
            y1={round(outerY)}
            x2={round(innerX)}
            y2={round(innerY)}
            stroke="rgba(230,220,255,0.16)"
            strokeWidth={house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10 ? 1.1 : 0.7}
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
            fill="rgba(226,218,246,0.64)"
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
    { longitude: chart.meta.ascendant, weight: 1.7 },
    { longitude: chart.meta.mc, weight: 1.55 },
  ];

  return (
    <>
      {axes.map((axis) => {
        const [x1, y1] = pointAtRadius(ZODIAC_OUTER + 2, axis.longitude, ascendant);
        const [x2, y2] = pointAtRadius(ZODIAC_OUTER + 2, axis.longitude + 180, ascendant);

        return (
          <line
            key={`axis-${axis.longitude}`}
            x1={round(x1)}
            y1={round(y1)}
            x2={round(x2)}
            y2={round(y2)}
            stroke="rgba(245,233,207,0.56)"
            strokeWidth={axis.weight}
          />
        );
      })}
    </>
  );
}

function SymbolicAspects({
  aspects,
  chart,
  ascendant,
  activePointId,
  hoveredPointId,
  highlightedAspectId,
}: {
  aspects: Aspect[];
  chart: NatalChartData;
  ascendant: number;
  activePointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  highlightedAspectId: string | null;
}) {
  const focusPointId = hoveredPointId ?? activePointId;

  return (
    <>
      {aspects.map((aspect) => {
        const fromPoint = chart.points.find((point) => point.id === aspect.from);
        const toPoint = chart.points.find((point) => point.id === aspect.to);

        if (!fromPoint || !toPoint) {
          return null;
        }

        const [x1, y1] = pointAtRadius(ASPECT_RADIUS, fromPoint.longitude, ascendant);
        const [x2, y2] = pointAtRadius(ASPECT_RADIUS, toPoint.longitude, ascendant);
        const definition = DISPLAY_ASPECTS.find((entry) => entry.type === aspect.type)!;
        const baseOpacity = normalizeOpacity(aspect.orb, definition.orb);
        const focused = focusPointId ? aspect.from === focusPointId || aspect.to === focusPointId : true;
        const highlighted = highlightedAspectId === aspect.id;
        const opacity = highlightedAspectId
          ? highlighted
            ? 1
            : 0.15
          : focusPointId
            ? focused
              ? baseOpacity
              : 0.2
            : baseOpacity;
        const strokeWidth = highlighted
          ? aspect.type === "conjunction"
            ? 1.9
            : 1.56
          : aspect.type === "conjunction"
            ? 0.95
            : 0.78;

        return (
          <line
            key={aspect.id}
            x1={round(x1)}
            y1={round(y1)}
            x2={round(x2)}
            y2={round(y2)}
            stroke={SYMBOLIC_ASPECT_COLORS[aspect.type]}
            strokeOpacity={opacity}
            strokeWidth={strokeWidth}
            strokeDasharray={aspect.type === "quincunx" ? "2 3" : undefined}
            strokeLinecap="round"
            style={{ filter: highlighted ? "url(#planet-hover-glow)" : "url(#symbolic-aspect-glow)" }}
          />
        );
      })}
    </>
  );
}

function PlanetLayer({
  points,
  ascendant,
  selectedPointId,
  hoveredPointId,
  panelOpen,
  onSelect,
  onHover,
}: {
  points: ChartPoint[];
  ascendant: number;
  selectedPointId: ChartPointId | null;
  hoveredPointId: ChartPointId | null;
  panelOpen: boolean;
  onSelect: (pointId: ChartPointId) => void;
  onHover: (pointId: ChartPointId | null) => void;
}) {
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
        const opacity = panelOpen && selectedPointId ? (selectedPointId === point.id ? 1 : 0.6) : 1;

        return (
          <g
            key={point.id}
            transform={scale !== 1 ? pointScaleTransform(glyphX, glyphY, scale) : undefined}
            onClick={() => onSelect(point.id)}
            onMouseEnter={() => onHover(point.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(point.id)}
            onBlur={() => onHover(null)}
            role="button"
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
              fontSize={point.id === "sun" ? "27" : "25"}
              fontWeight="500"
              style={{ filter: glow }}
            >
              {point.glyph}
            </text>

            <text
              x={round(labelX)}
              y={round(labelY - 6)}
              textAnchor={anchor}
              dominantBaseline="central"
              fill="rgba(242,235,248,0.86)"
              fontFamily="'Inter', sans-serif"
              fontSize="10.5"
              fontWeight="500"
            >
              {String(point.degreeInSign).padStart(2, "0")}° {String(point.minutesInSign).padStart(2, "0")}′
            </text>

            {point.retrograde ? (
              <text
                x={round(labelX)}
                y={round(labelY + 8)}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="rgba(232,197,71,0.92)"
                fontFamily="'Spectral', serif"
                fontSize="10.5"
              >
                ℞
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

function DefaultWheel({ chart, ascendant }: { chart: NatalChartData; ascendant: number }) {
  return (
    <>
      {zodiacSigns.map((sign) => (
        <path
          key={sign.id}
          d={describeRingSegment(ZODIAC_INNER, ZODIAC_OUTER, sign.start, sign.start + 30, ascendant)}
          fill={sign.color}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
        />
      ))}
      <TickRing ascendant={ascendant} />
      <HouseGeometry chart={chart} ascendant={ascendant} />
      <AxisLines chart={chart} ascendant={ascendant} />
    </>
  );
}

export function NatalChartWheel({ chart, variant = "default" }: Props) {
  const { selectedPointId, hoveredAspectId, panelOpen, showMinorPoints, selectPoint, openPanel } = useChartStore();
  const [hoveredPointId, setHoveredPointId] = useState<ChartPointId | null>(null);

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

  const displayAspects = useMemo(() => detectDisplayAspects(displayPoints), [displayPoints]);

  function handleSelect(pointId: ChartPointId) {
    selectPoint(pointId);
    openPanel();
  }

  return (
    <div className="relative aspect-square w-full max-w-[48rem]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative h-full w-full" role="img" aria-label="Carta natal interactiva">
        <defs>
          <radialGradient id="symbolic-bg" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1a0a2e" />
            <stop offset="52%" stopColor="#0f0621" />
            <stop offset="100%" stopColor="#0a0418" />
          </radialGradient>
          <radialGradient id="symbolic-center-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="28%" stopColor="rgba(218,196,255,0.18)" />
            <stop offset="100%" stopColor="rgba(218,196,255,0)" />
          </radialGradient>
          <filter id="symbolic-sign-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planet-glow">
            <feGaussianBlur stdDeviation="1.7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="planet-hover-glow">
            <feGaussianBlur stdDeviation="3.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="symbolic-aspect-glow">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {variant === "symbolic" ? (
          <>
            <rect width={SIZE} height={SIZE} fill="url(#symbolic-bg)" rx="430" />

            <g opacity="0.9">
              <animateTransform attributeName="transform" attributeType="XML" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="600s" repeatCount="indefinite" />
              {STARFIELD.map((star, index) => (
                <circle
                  key={`star-${index}`}
                  cx={round(star.x)}
                  cy={round(star.y)}
                  r={round(star.radius)}
                  fill={`rgba(255,255,255,${round(star.opacity)})`}
                />
              ))}
            </g>

            <g opacity="0.28">
              <ellipse cx="250" cy="260" rx="170" ry="96" fill="rgba(168,98,212,0.16)" filter="url(#planet-hover-glow)" />
              <ellipse cx="620" cy="580" rx="190" ry="120" fill="rgba(255,77,109,0.10)" filter="url(#planet-hover-glow)" />
              <ellipse cx="610" cy="220" rx="145" ry="82" fill="rgba(77,154,255,0.10)" filter="url(#planet-hover-glow)" />
            </g>

            <SymbolicWheelFrame ascendant={ascendant} />
            <TickRing ascendant={ascendant} />
            <HouseGeometry chart={displayChart} ascendant={ascendant} />
            <AxisLines chart={displayChart} ascendant={ascendant} />
            <SymbolicAspects
              aspects={displayAspects}
              chart={displayChart}
              ascendant={ascendant}
              activePointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              highlightedAspectId={hoveredAspectId}
            />

            <circle cx={CX} cy={CY} r={CENTER_GLOW_RADIUS} fill="url(#symbolic-center-glow)">
              <animate attributeName="opacity" values="0.76;1;0.76" dur="2.8s" repeatCount="indefinite" />
            </circle>

            <PlanetLayer
              points={displayPoints}
              ascendant={ascendant}
              selectedPointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              panelOpen={panelOpen}
              onSelect={handleSelect}
              onHover={setHoveredPointId}
            />
          </>
        ) : (
          <>
            <rect width={SIZE} height={SIZE} fill="url(#symbolic-bg)" rx="430" />
            <DefaultWheel chart={displayChart} ascendant={ascendant} />
            <SymbolicAspects
              aspects={displayAspects}
              chart={displayChart}
              ascendant={ascendant}
              activePointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              highlightedAspectId={hoveredAspectId}
            />
            <PlanetLayer
              points={displayPoints}
              ascendant={ascendant}
              selectedPointId={selectedPointId}
              hoveredPointId={hoveredPointId}
              panelOpen={panelOpen}
              onSelect={handleSelect}
              onHover={setHoveredPointId}
            />
          </>
        )}
      </svg>
    </div>
  );
}
