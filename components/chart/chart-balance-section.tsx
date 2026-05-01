"use client";

import type { Dictionary } from "@/lib/i18n";
import {
  getSignFromLongitude,
  zodiacSigns,
  type Element,
  type Modality,
  type NatalChartData,
} from "@/lib/chart";

const BALANCE_POINT_IDS = [
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
] as const;

const ELEMENT_ORDER: Element[] = ["fire", "earth", "air", "water"];
const MODALITY_ORDER: Modality[] = ["cardinal", "fixed", "mutable"];

const ELEMENT_COLORS: Record<Element, string> = {
  fire: "#c97a8a",
  earth: "#8a7a9c",
  air: "#7a9ac9",
  water: "#6b6ba8",
};

type ChartBalanceSectionProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function dominantKey<TKey extends string>(counts: Record<TKey, number>, order: TKey[]) {
  return order.reduce((dominant, key) => (
    counts[key] > counts[dominant] ? key : dominant
  ), order[0]!);
}

function polarPoint(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 120 + radius * Math.cos(radians),
    y: 120 + radius * Math.sin(radians),
  };
}

function arcPath(startAngle: number, endAngle: number) {
  const radius = 80;
  const start = polarPoint(radius, startAngle);
  const end = polarPoint(radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function ChartBalanceSection({ chart, dictionary }: ChartBalanceSectionProps) {
  const balancePoints = chart.points.filter((point) =>
    BALANCE_POINT_IDS.includes(point.id as (typeof BALANCE_POINT_IDS)[number]),
  );
  const ascendantSign = getSignFromLongitude(chart.meta.ascendant);
  const allSigns = [...balancePoints.map((point) => point.sign), ascendantSign];
  const total = allSigns.length;

  const elementCounts: Record<Element, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };

  const modalityCounts: Record<Modality, number> = {
    cardinal: 0,
    fixed: 0,
    mutable: 0,
  };

  allSigns.forEach((signId) => {
    const sign = zodiacSigns.find((entry) => entry.id === signId);
    if (!sign) {
      return;
    }

    elementCounts[sign.element] += 1;
    modalityCounts[sign.modality] += 1;
  });

  const dominantElement = dominantKey(elementCounts, ELEMENT_ORDER);
  const dominantModality = dominantKey(modalityCounts, MODALITY_ORDER);
  const modalityLine = MODALITY_ORDER.map(
    (modality) => `${dictionary.result.modalities[modality]} ${percent(modalityCounts[modality], total)}%`,
  ).join(" · ");

  const quadrants: Array<{ element: Element; start: number; end: number; labelAngle: number }> = [
    { element: "fire", start: -89.5, end: -0.5, labelAngle: -45 },
    { element: "earth", start: 0.5, end: 89.5, labelAngle: 45 },
    { element: "air", start: 90.5, end: 179.5, labelAngle: 135 },
    { element: "water", start: 180.5, end: 269.5, labelAngle: 225 },
  ];

  return (
    <section className="py-5 lg:pt-0 lg:pb-14">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.5)]">
          tu equilibrio
        </p>
        <h2 className="mt-1.5 font-serif text-[30px] font-normal leading-tight text-ivory lg:text-[36px]">
          {dictionary.result.elements[dominantElement]} dominante · {dictionary.result.modalities[dominantModality]} en exceso
        </h2>
      </div>

      <div className="mx-auto mt-8 grid max-w-[720px] gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:items-center lg:mt-10 lg:max-w-[820px] lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
        <div className="text-center">
          <svg viewBox="0 0 240 240" className="h-[200px] w-[200px] lg:h-[270px] lg:w-[270px]" role="img" aria-label="Equilibrio de elementos">
            {quadrants.map(({ element, start, end, labelAngle }) => {
              const elementPercent = percent(elementCounts[element], total);
              const labelPoint = polarPoint(80, labelAngle);
              const active = element === dominantElement;

              return (
                <g key={element}>
                  <path
                    d={arcPath(start, end)}
                    fill="none"
                    stroke={ELEMENT_COLORS[element]}
                    strokeWidth={active ? "46" : "40"}
                    opacity={Math.min(1, Math.max(0.25, elementPercent / 50))}
                    className="transition-all duration-200"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y - 4}
                    textAnchor="middle"
                    className="font-serif text-[12px]"
                    fill={active ? "#e8c547" : "rgba(255,255,255,0.7)"}
                  >
                    {dictionary.result.elements[element]}
                  </text>
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y + 10}
                    textAnchor="middle"
                    className="font-serif text-[12px]"
                    fill={active ? "#e8c547" : "rgba(255,255,255,0.7)"}
                  >
                    {elementPercent}%
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-3 text-center text-xs leading-6 text-[#3a3048] lg:hidden">
            {modalityLine}
          </p>
        </div>

        <div className="grid gap-3">
          {ELEMENT_ORDER.map((element) => {
            const active = element === dominantElement;
            return (
              <div
                key={element}
                className={[
                  "flex items-center justify-between border-b border-black/10 py-3 last:border-b-0",
                  active ? "text-ivory" : "text-[#3a3048]",
                ].join(" ")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {dictionary.result.elements[element]}
                </span>
                <span className="font-serif text-[22px] leading-none">
                  {percent(elementCounts[element], total)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mx-auto mt-7 hidden max-w-[720px] text-center font-serif text-sm italic leading-6 text-[#3a3048] lg:block">
        {modalityLine}
      </p>
    </section>
  );
}
