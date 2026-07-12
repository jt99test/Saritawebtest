"use client";

import { AnimatePresence, motion } from "motion/react";

import { formatHouseWithTransition } from "@/components/chart/chart-helpers";
import { useChartStore } from "@/components/chart/chart-store";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import {
  formatSignPosition,
  getAugmentedChartPoints,
  getHouseForLongitude,
  isAnglePointId,
  type AnglePointId,
  type ChartReferencePointId,
  type NatalChartData,
} from "@/lib/chart";
import { dictionaries } from "@/lib/i18n";

type Props = {
  chart: NatalChartData;
};

const ANGLE_GLYPHS: Record<AnglePointId, string> = {
  ascendant: "AC",
  descendant: "DC",
  mc: "MC",
  ic: "IC",
};

const ANGLE_LONGITUDES = {
  ascendant: (chart: NatalChartData) => chart.meta.ascendant,
  descendant: (chart: NatalChartData) => chart.meta.descendant,
  mc: (chart: NatalChartData) => chart.meta.mc,
  ic: (chart: NatalChartData) => chart.meta.ic,
} satisfies Record<AnglePointId, (chart: NatalChartData) => number>;

export function AspectDetailPanel({ chart }: Props) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const { selectedAspect, selectAspect } = useChartStore();

  const allPoints = getAugmentedChartPoints(chart);
  const pointsById = new Map(allPoints.map((point) => [point.id, point] as const));

  function getAspectPoint(pointId: ChartReferencePointId) {
    const point = isAnglePointId(pointId) ? null : pointsById.get(pointId);
    if (point) {
      return point;
    }

    if (!isAnglePointId(pointId)) {
      return null;
    }

    const longitude = ANGLE_LONGITUDES[pointId](chart);
    const position = formatSignPosition(longitude);

    return {
      id: pointId,
      glyph: ANGLE_GLYPHS[pointId],
      longitude,
      sign: position.sign,
      house: getHouseForLongitude(longitude, chart.houses),
      color: "#f1d28f",
    };
  }

  const fromPoint = selectedAspect ? getAspectPoint(selectedAspect.from) : null;
  const toPoint = selectedAspect ? getAspectPoint(selectedAspect.to) : null;
  const housePrefix = dictionary.result.transitPage.housePrefix.toLowerCase();
  const fromHouse = fromPoint
    ? formatHouseWithTransition({ longitude: fromPoint.longitude, house: fromPoint.house, houses: chart.houses })
    : "";
  const toHouse = toPoint
    ? formatHouseWithTransition({ longitude: toPoint.longitude, house: toPoint.house, houses: chart.houses })
    : "";

  return (
    <AnimatePresence>
      {selectedAspect && fromPoint && toPoint ? (
        <motion.div
          key={selectedAspect.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+6.7rem)] left-1/2 z-[90] -translate-x-1/2 px-4 md:bottom-6 md:z-50"
        >
          <div className="relative w-[min(520px,calc(100vw-2rem))] rounded-[1rem] border border-[#f5d782]/24 bg-[#061331]/92 px-5 py-5 text-[#fffaf0] shadow-[0_18px_58px_rgba(0,0,0,0.42)] backdrop-blur-[18px] sm:px-6">
            <button
              type="button"
              onClick={() => selectAspect(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#f5d782]/30 bg-[#030814]/88 text-[16px] leading-none text-[#fffaf0] shadow-[0_0_18px_rgba(0,0,0,0.28)] transition hover:border-[#f5d782]/55 hover:bg-[#f5d782]/12"
              aria-label={dictionary.common.close}
            >
              x
            </button>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7e7ff]/18 bg-[#fffaf0]/92 font-serif text-[1.5rem] leading-none shadow-[0_0_22px_rgba(124,191,255,0.16)]"
                  style={{ color: fromPoint.color }}
                >
                  {fromPoint.glyph}
                </span>
                <span className="mt-2 truncate font-serif text-[15px] leading-none text-[#fffaf0]">
                  {dictionary.result.points[fromPoint.id]}
                </span>
                <span className="mt-1 truncate text-[12px] text-[#d7e7ff]/68">
                  {dictionary.result.signs[fromPoint.sign]} {"\u00b7"} {housePrefix} {fromHouse}
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span className="font-serif text-[1.6rem] leading-none text-[#f5d782]">
                  {dictionary.result.aspectSymbols[selectedAspect.type]}
                </span>
                <span className="max-w-[8rem] truncate text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#fffaf0]/80">
                  {dictionary.result.aspectTypes[selectedAspect.type]}
                </span>
                <span className="border border-[#f5d782]/30 bg-[#f5d782]/10 px-2.5 py-1 text-[12px] font-semibold text-[#f5d782]">
                  {selectedAspect.orb.toFixed(1)}
                  {"\u00b0"}
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7e7ff]/18 bg-[#fffaf0]/92 font-serif text-[1.5rem] leading-none shadow-[0_0_22px_rgba(124,191,255,0.16)]"
                  style={{ color: toPoint.color }}
                >
                  {toPoint.glyph}
                </span>
                <span className="mt-2 truncate font-serif text-[15px] leading-none text-[#fffaf0]">
                  {dictionary.result.points[toPoint.id]}
                </span>
                <span className="mt-1 truncate text-[12px] text-[#d7e7ff]/68">
                  {dictionary.result.signs[toPoint.sign]} {"\u00b7"} {housePrefix} {toHouse}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
