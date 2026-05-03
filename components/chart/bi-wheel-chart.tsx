"use client";

import { useMemo, useState } from "react";

import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import { getAugmentedChartPoints, normalizeLongitude, zodiacSigns } from "@/lib/chart";

export type BiWheelVariant = "solar-return" | "synastry";

type BiWheelChartProps = {
  innerChart: NatalChartData;
  outerChart?: NatalChartData;
  innerLabel?: string;
  outerLabel?: string;
  variant?: BiWheelVariant;
  innerPointIds?: ChartPointId[];
  outerPointIds?: ChartPointId[];
  onInnerPlanetSelect?: (pointId: ChartPointId) => void;
  onOuterPlanetSelect?: (pointId: ChartPointId) => void;
};

const CENTER = 430;
const INNER_ZODIAC_R = 372;
const ZODIAC_OUTER_R = 402;
const ZODIAC_INNER_R = 344;
const INNER_PLANET_R = 286;
const INNER_LABEL_R = 316;
const OUTER_SEP_R = 343;
const OUTER_PLANET_R = 414;
const OUTER_LABEL_R = 432;
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
  aries: "\u2648",
  taurus: "\u2649",
  gemini: "\u264a",
  cancer: "\u264b",
  leo: "\u264c",
  virgo: "\u264d",
  libra: "\u264e",
  scorpio: "\u264f",
  Sagittarius: "\u2650",
  sagittarius: "\u2650",
  capricorn: "\u2651",
  aquarius: "\u2652",
  pisces: "\u2653",
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
    primary: "#8f7b45",
    muted: "rgba(105,91,52,0.94)",
    ring: "rgba(143,123,69,0.46)",
    bg: "rgba(143,123,69,0.1)",
  },
  synastry: {
    primary: "#8f7b45",
    muted: "rgba(105,91,52,0.94)",
    ring: "rgba(143,123,69,0.46)",
    bg: "rgba(143,123,69,0.1)",
  },
} as const;

const ELEMENT_TINTS = {
  fire: "rgba(209,118,118,0.14)",
  earth: "rgba(216,194,122,0.1)",
  air: "rgba(140,158,240,0.1)",
  water: "rgba(110,170,190,0.12)",
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
  return "#1e1a2e";
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
  if (type === "trine" || type === "sextile") return "rgba(74,90,154,0.7)";
  if (type === "square" || type === "opposition") return "rgba(170,71,66,0.68)";
  return "rgba(138,122,78,0.72)";
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

export function BiWheelChart({
  innerChart,
  outerChart,
  innerLabel = innerChart.event.name,
  outerLabel = outerChart?.event.name,
  variant = "solar-return",
  innerPointIds,
  outerPointIds,
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
  const outerActive = hoveredOuter || selectedOuter;
  const activePoint = [...innerPoints, ...outerPoints].find(
    (point) => point.id === (hoveredInner ?? hoveredOuter),
  );

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
            <stop offset="0%" stopColor="#f5f0e6" />
            <stop offset="68%" stopColor="#ede7d9" />
            <stop offset="100%" stopColor="#ddd6c6" />
          </radialGradient>
          <filter id="bw-soft-halo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bw-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-hover-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-outer-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r="412" fill="url(#bw-surface-bg)" stroke="rgba(30,26,46,0.18)" strokeWidth="1.3" />
        <circle cx={CENTER} cy={CENTER} r="398" fill="none" stroke="rgba(143,123,69,0.13)" strokeWidth="10" />
        <circle cx={CENTER} cy={CENTER} r="420" fill="url(#bw-field-glow)" />
        <circle cx={CENTER} cy={CENTER} r="392" fill="none" stroke="rgba(30,26,46,0.06)" strokeWidth="16" filter="url(#bw-soft-halo)" />
        {outerChart ? (
          <>
            <circle cx={CENTER} cy={CENTER} r={OUTER_SEP_R} fill="none" stroke="rgba(30,26,46,0.2)" strokeWidth="1.2" strokeDasharray="4 9" />
            <circle cx={CENTER} cy={CENTER} r={OUTER_PLANET_R} fill="none" stroke="rgba(143,123,69,0.09)" strokeWidth="16" filter="url(#bw-soft-halo)" />
          </>
        ) : null}

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
                  stroke="rgba(30,26,46,0.18)"
                  strokeWidth="1"
                />
                <text
                  x={label.x}
                  y={label.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-serif text-[22px] font-semibold"
                  fill={zodiacLabelFill(sign.element)}
                  fillOpacity="0.58"
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                >
                  {SIGN_SYMBOLS[sign.id]}
                </text>
              </g>
            );
          })}
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R + 2} fill="none" stroke="rgba(30,26,46,0.38)" strokeWidth="1.2" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_OUTER_R - 12} fill="none" stroke="rgba(30,26,46,0.14)" strokeWidth="0.7" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R + 12} fill="none" stroke="rgba(30,26,46,0.14)" strokeWidth="0.7" />
          <circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER_R} fill="none" stroke="rgba(30,26,46,0.42)" strokeWidth="1.2" />
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
            const start = pointAtRadius(172, from.longitude, ascendant);
            const end = pointAtRadius(172, to.longitude, ascendant);
            return <line key={aspect.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={aspectStroke(aspect.type)} strokeWidth="1.1" />;
          })}
          <circle cx={CENTER} cy={CENTER} r="5" fill="rgba(30,26,46,0.62)" filter="url(#bw-glow)" />

          {innerPoints.map((point) => {
            const active = hoveredInner === point.id || selectedInner === point.id;
            const position = pointAtRadius(INNER_PLANET_R, point.longitude, ascendant);
            const label = pointAtRadius(INNER_LABEL_R, point.longitude, ascendant);
            return (
              <g
                key={point.id}
                role="button"
                tabIndex={0}
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
                {active ? (
                  <circle cx={position.x} cy={position.y} r="29" fill="rgba(232,197,71,0.08)" stroke={point.color} strokeOpacity="0.55" strokeWidth="1.2" />
                ) : null}
                <circle cx={position.x} cy={position.y} r="20" fill="#fffaf0" stroke="rgba(138,122,78,0.42)" strokeWidth="0.8" filter="url(#bw-glow)" />
                <text
                  x={position.x}
                  y={position.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={point.color}
                  fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                  fontSize="27"
                  fontWeight="700"
                  stroke="#fffaf0"
                  strokeWidth="1.6"
                  paintOrder="stroke fill"
                  style={{ filter: active ? "url(#bw-hover-glow)" : "url(#bw-glow)" }}
                >
                  {POINT_SYMBOLS[point.id]}
                </text>
                {active ? <text x={label.x} y={label.y} textAnchor="middle" className="text-[12px] font-semibold" fill="#1e1a2e">{degreeLabel(point)}</text> : null}
              </g>
            );
          })}
        </g>

        {outerPoints.map((point) => {
          const active = hoveredOuter === point.id || selectedOuter === point.id;
          const tickStart = pointAtRadius(OUTER_SEP_R + 3, point.longitude, ascendant);
          const tickEnd = pointAtRadius(OUTER_PLANET_R - 21, point.longitude, ascendant);
          const position = pointAtRadius(OUTER_PLANET_R, point.longitude, ascendant);
          const label = pointAtRadius(OUTER_LABEL_R, point.longitude, ascendant);
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
              <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke={active ? colors.primary : "rgba(30,26,46,0.18)"} strokeWidth={active ? "1.4" : "0.7"} strokeLinecap="round" />
              {active ? (
                <circle cx={position.x} cy={position.y} r="28" fill="rgba(232,197,71,0.08)" stroke={colors.primary} strokeOpacity="0.55" strokeWidth="1.1" />
              ) : null}
              <circle cx={position.x} cy={position.y} r="20" fill="#fffaf0" stroke="rgba(138,122,78,0.42)" strokeWidth="0.8" filter="url(#bw-glow)" />
              <text
                x={position.x}
                y={position.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={point.color}
                fontFamily="'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Arial Unicode MS', serif"
                fontSize="27"
                fontWeight="700"
                stroke="#fffaf0"
                strokeWidth="1.6"
                paintOrder="stroke fill"
                style={{ filter: active ? "url(#bw-outer-glow)" : "url(#bw-glow)" }}
              >
                {POINT_SYMBOLS[point.id]}
              </text>
              {active ? <text x={label.x} y={label.y} textAnchor="middle" className="text-[12px] font-semibold" fill={colors.primary}>{degreeLabel(point)}</text> : null}
            </g>
          );
        })}

        {outerChart && variant === "solar-return" ? (
          <SolarReturnAngleMarkers chart={outerChart} ascendant={ascendant} />
        ) : null}

      </svg>

      <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <span className="h-2.5 w-2.5 rounded-full bg-ivory" />
          {innerLabel}
        </span>
        {outerChart ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
            {outerLabel}
          </span>
        ) : null}
      </div>

      {activePoint ? (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl border border-dusty-gold/45 bg-[#fffaf0] px-4 py-2 text-center shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <p className="font-serif text-lg font-semibold text-ivory">{activePoint.glyph} {degreeLabel(activePoint)}</p>
        </div>
      ) : null}
    </div>
  );
}
