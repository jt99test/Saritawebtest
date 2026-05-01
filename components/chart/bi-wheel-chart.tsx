"use client";

import { useMemo, useState } from "react";

import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import { formatSignPosition, normalizeLongitude, zodiacSigns } from "@/lib/chart";

export type BiWheelVariant = "solar-return" | "synastry";

type BiWheelChartProps = {
  innerChart: NatalChartData;
  outerChart?: NatalChartData;
  innerLabel?: string;
  outerLabel?: string;
  variant?: BiWheelVariant;
  onInnerPlanetSelect?: (pointId: ChartPointId) => void;
  onOuterPlanetSelect?: (pointId: ChartPointId) => void;
};

const CENTER = 430;
const INNER_ZODIAC_R = 372;
const INNER_PLANET_R = 286;
const INNER_LABEL_R = 316;
const OUTER_SEP_R = 343;
const OUTER_PLANET_R = 374;
const OUTER_LABEL_R = 412;
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
]);

const VARIANTS = {
  "solar-return": {
    primary: "#8a7a4e",
    muted: "rgba(111,97,58,0.9)",
    ring: "rgba(138,122,78,0.38)",
    bg: "rgba(138,122,78,0.08)",
  },
  synastry: {
    primary: "#8a7a4e",
    muted: "rgba(111,97,58,0.9)",
    ring: "rgba(138,122,78,0.38)",
    bg: "rgba(138,122,78,0.08)",
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

function visiblePoints(chart: NatalChartData) {
  return chart.points.filter((point) => DRAWABLE_IDS.has(point.id));
}

function degreeLabel(point: ChartPoint) {
  return `${point.degreeInSign}°${String(point.minutesInSign).padStart(2, "0")}'`;
}

function aspectStroke(type: string) {
  if (type === "trine" || type === "sextile") return "rgba(74,90,154,0.7)";
  if (type === "square" || type === "opposition") return "rgba(170,71,66,0.68)";
  return "rgba(138,122,78,0.72)";
}

export function BiWheelChart({
  innerChart,
  outerChart,
  innerLabel = innerChart.event.name,
  outerLabel = outerChart?.event.name,
  variant = "solar-return",
  onInnerPlanetSelect,
  onOuterPlanetSelect,
}: BiWheelChartProps) {
  const colors = VARIANTS[variant];
  const [hoveredInner, setHoveredInner] = useState<ChartPointId | null>(null);
  const [selectedInner, setSelectedInner] = useState<ChartPointId | null>(null);
  const [hoveredOuter, setHoveredOuter] = useState<ChartPointId | null>(null);
  const [selectedOuter, setSelectedOuter] = useState<ChartPointId | null>(null);
  const innerPoints = useMemo(() => visiblePoints(innerChart), [innerChart]);
  const outerPoints = useMemo(() => outerChart ? visiblePoints(outerChart) : [], [outerChart]);
  const ascendant = innerChart.meta.ascendant;
  const outerActive = hoveredOuter || selectedOuter;
  const activePoint = [...innerPoints, ...outerPoints].find(
    (point) => point.id === (hoveredInner ?? hoveredOuter),
  );

  return (
    <div className="relative mx-auto max-w-[860px]">
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

        <circle cx={CENTER} cy={CENTER} r="412" fill="url(#bw-surface-bg)" stroke="rgba(30,26,46,0.16)" strokeWidth="1.2" />
        <circle cx={CENTER} cy={CENTER} r="398" fill="none" stroke="rgba(138,122,78,0.1)" strokeWidth="10" />
        <circle cx={CENTER} cy={CENTER} r="420" fill="url(#bw-field-glow)" />
        <circle cx={CENTER} cy={CENTER} r="392" fill="none" stroke="rgba(30,26,46,0.06)" strokeWidth="16" filter="url(#bw-soft-halo)" />
        {outerChart ? (
          <>
            <circle cx={CENTER} cy={CENTER} r={OUTER_SEP_R} fill="none" stroke="rgba(30,26,46,0.18)" strokeWidth="1.2" strokeDasharray="4 9" />
            <circle cx={CENTER} cy={CENTER} r={OUTER_PLANET_R} fill="none" stroke="rgba(30,26,46,0.06)" strokeWidth="16" filter="url(#bw-soft-halo)" />
          </>
        ) : null}

        <g transform="translate(430 430) scale(0.78) translate(-430 -430)">
          <circle cx={CENTER} cy={CENTER} r="386" fill="rgba(255,250,240,0.28)" stroke="rgba(30,26,46,0.2)" />
          <circle cx={CENTER} cy={CENTER} r="356" fill="none" stroke="rgba(30,26,46,0.08)" strokeWidth="18" />
          {zodiacSigns.map((sign) => (
            <path
              key={sign.id}
              d={describeRingSegment(sign.start, sign.start + 30, 324, INNER_ZODIAC_R, ascendant)}
              fill={ELEMENT_TINTS[sign.element]}
              stroke="rgba(30,26,46,0.18)"
            />
          ))}
          {innerChart.houses.map((house) => {
            const line = pointAtRadius(324, house.longitude, ascendant);
            const cuspTick = pointAtRadius(360, house.longitude, ascendant);
            const cuspLabel = pointAtRadius(398, house.longitude, ascendant);
            const position = formatSignPosition(house.longitude);
            return (
              <g key={house.house}>
                <line x1={CENTER} y1={CENTER} x2={line.x} y2={line.y} stroke="rgba(30,26,46,0.28)" />
                <line x1={cuspTick.x} y1={cuspTick.y} x2={cuspLabel.x} y2={cuspLabel.y} stroke="rgba(30,26,46,0.28)" />
                <g>
                  <circle cx={cuspLabel.x} cy={cuspLabel.y} r="9" fill="rgba(255,250,240,0.74)" />
                  <text
                    x={cuspLabel.x}
                    y={cuspLabel.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[11px] font-bold"
                    fill="rgba(30,26,46,0.84)"
                  >
                    {position.degreeInSign}°
                  </text>
                </g>
              </g>
            );
          })}
          {innerChart.houses.map((house, index) => {
            const nextHouse = innerChart.houses[(index + 1) % innerChart.houses.length] ?? innerChart.houses[0]!;
            const label = pointAtRadius(215, midpointLongitude(house.longitude, nextHouse.longitude), ascendant);
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
                <circle cx={position.x} cy={position.y} r={active ? "30" : "25"} fill={point.color} opacity={active ? "0.18" : "0.1"} filter="url(#bw-soft-halo)" />
                <circle cx={position.x} cy={position.y} r="18" fill="#fffaf0" stroke={active ? point.color : "rgba(138,122,78,0.42)"} strokeWidth={active ? "1.6" : "1"} filter={active ? "url(#bw-hover-glow)" : "url(#bw-glow)"} />
                <text x={position.x} y={position.y + 1} textAnchor="middle" dominantBaseline="central" className="font-serif text-[22px]" fill={point.color} stroke="#fffaf0" strokeWidth="1.4" paintOrder="stroke fill">{point.glyph}</text>
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
              <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke={active ? colors.primary : colors.ring} strokeWidth={active ? "1.8" : "1.1"} />
              <circle cx={position.x} cy={position.y} r={active ? "32" : "26"} fill={colors.primary} opacity={active ? "0.18" : "0.09"} filter="url(#bw-soft-halo)" />
              <circle cx={position.x} cy={position.y} r="19" fill="#fffaf0" stroke={active ? colors.primary : colors.ring} strokeWidth={active ? "1.7" : "1.1"} filter={active ? "url(#bw-outer-glow)" : "url(#bw-glow)"} />
              <text x={position.x} y={position.y + 1} textAnchor="middle" dominantBaseline="central" className="font-serif text-[22px]" fill={active ? colors.primary : colors.muted} stroke="#fffaf0" strokeWidth="1.4" paintOrder="stroke fill">{point.glyph}</text>
              {active ? <text x={label.x} y={label.y} textAnchor="middle" className="text-[12px] font-semibold" fill={colors.primary}>{degreeLabel(point)}</text> : null}
            </g>
          );
        })}

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
