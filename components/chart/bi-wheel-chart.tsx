"use client";

import { useMemo, useState } from "react";

import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import { normalizeLongitude, zodiacSigns } from "@/lib/chart";

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
    primary: "rgba(181,163,110,1)",
    muted: "rgba(181,163,110,0.55)",
    ring: "rgba(181,163,110,0.32)",
    bg: "rgba(181,163,110,0.08)",
  },
  synastry: {
    primary: "rgba(130,146,214,1)",
    muted: "rgba(130,146,214,0.55)",
    ring: "rgba(130,146,214,0.32)",
    bg: "rgba(130,146,214,0.08)",
  },
} as const;

function pointAngle(longitude: number, ascendant: number) {
  return normalizeLongitude(longitude - ascendant + 180);
}

function pointAtRadius(radius: number, longitude: number, ascendant: number) {
  const angle = ((pointAngle(longitude, ascendant) - 90) * Math.PI) / 180;
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
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function visiblePoints(chart: NatalChartData) {
  return chart.points.filter((point) => DRAWABLE_IDS.has(point.id));
}

function degreeLabel(point: ChartPoint) {
  return `${point.degreeInSign}°${String(point.minutesInSign).padStart(2, "0")}'`;
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
    (point) => point.id === (hoveredInner ?? selectedInner ?? hoveredOuter ?? selectedOuter),
  );

  return (
    <div className="relative mx-auto max-w-[860px]">
      <svg viewBox="0 0 860 860" className="h-auto w-full" role="img" aria-label={outerChart ? `${innerLabel} / ${outerLabel}` : innerLabel}>
        <defs>
          <filter id="bw-glow"><feGaussianBlur stdDeviation="1.6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-hover-glow"><feGaussianBlur stdDeviation="3.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bw-outer-glow"><feGaussianBlur stdDeviation="2.6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r="420" fill="rgba(255,255,255,0.018)" />
        {outerChart ? <circle cx={CENTER} cy={CENTER} r={OUTER_SEP_R} fill="none" stroke={colors.ring} strokeDasharray="4 8" /> : null}

        <g transform="translate(430 430) scale(0.78) translate(-430 -430)">
          <circle cx={CENTER} cy={CENTER} r="386" fill="rgba(6,8,14,0.72)" stroke="rgba(255,255,255,0.08)" />
          {zodiacSigns.map((sign) => (
            <path
              key={sign.id}
              d={describeRingSegment(sign.start, sign.start + 30, 324, INNER_ZODIAC_R, ascendant)}
              fill={sign.color}
              opacity="0.16"
              stroke="rgba(255,255,255,0.08)"
            />
          ))}
          {innerChart.houses.map((house) => {
            const line = pointAtRadius(324, house.longitude, ascendant);
            return <line key={house.house} x1={CENTER} y1={CENTER} x2={line.x} y2={line.y} stroke="rgba(255,255,255,0.13)" />;
          })}
          {innerChart.aspects.slice(0, 32).map((aspect) => {
            const from = innerPoints.find((point) => point.id === aspect.from);
            const to = innerPoints.find((point) => point.id === aspect.to);
            if (!from || !to) return null;
            const start = pointAtRadius(172, from.longitude, ascendant);
            const end = pointAtRadius(172, to.longitude, ascendant);
            return <line key={aspect.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="rgba(130,146,214,0.25)" />;
          })}
          <circle cx={CENTER} cy={CENTER} r="4" fill="rgba(255,255,255,0.55)" />

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
                className="cursor-pointer"
              >
                <circle cx={position.x} cy={position.y} r="18" fill="rgba(6,8,14,0.88)" stroke={active ? point.color : "rgba(255,255,255,0.14)"} filter={active ? "url(#bw-hover-glow)" : "url(#bw-glow)"} />
                <text x={position.x} y={position.y + 1} textAnchor="middle" dominantBaseline="central" className="font-serif text-[22px]" fill={active ? point.color : "rgba(255,255,255,0.72)"}>{point.glyph}</text>
                {active ? <text x={label.x} y={label.y} textAnchor="middle" className="text-[10px] font-semibold" fill="rgba(255,255,255,0.62)">{degreeLabel(point)}</text> : null}
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
              className="cursor-pointer"
            >
              <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke={active ? colors.primary : colors.ring} />
              <circle cx={position.x} cy={position.y} r="19" fill="rgba(6,8,14,0.92)" stroke={active ? colors.primary : colors.ring} filter={active ? "url(#bw-outer-glow)" : undefined} />
              <text x={position.x} y={position.y + 1} textAnchor="middle" dominantBaseline="central" className="font-serif text-[22px]" fill={active ? colors.primary : colors.muted}>{point.glyph}</text>
              <text x={label.x} y={label.y} textAnchor="middle" className="text-[9px] font-semibold" fill={active ? colors.primary : "rgba(255,255,255,0.36)"}>{degreeLabel(point)}</text>
            </g>
          );
        })}

        <g transform={outerChart ? "translate(292 848)" : "translate(392 848)"}>
          <circle r="4" fill="rgba(255,255,255,0.5)" />
          <text x="14" y="4" className="text-[10px] font-semibold uppercase tracking-[0.2em]" fill="rgba(255,255,255,0.5)">{innerLabel}</text>
        </g>
        {outerChart ? (
          <g transform="translate(510 848)">
            <circle r="4" fill={colors.primary} />
            <text x="14" y="4" className="text-[10px] font-semibold uppercase tracking-[0.2em]" fill={colors.primary}>{outerLabel}</text>
          </g>
        ) : null}
      </svg>

      {activePoint ? (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 border border-white/10 bg-cosmic-950/92 px-4 py-2 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <p className="font-serif text-lg text-ivory">{activePoint.glyph} {degreeLabel(activePoint)}</p>
        </div>
      ) : null}
    </div>
  );
}
