"use client";

import { AnimatePresence, motion } from "motion/react";

import { useChartStore } from "@/components/chart/chart-store";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { getAugmentedChartPoints, type NatalChartData } from "@/lib/chart";
import { dictionaries } from "@/lib/i18n";

type Props = {
  chart: NatalChartData;
};

export function AspectDetailPanel({ chart }: Props) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const { selectedAspect, selectAspect } = useChartStore();

  const allPoints = getAugmentedChartPoints(chart);
  const pointsById = new Map(allPoints.map((point) => [point.id, point] as const));

  const fromPoint = selectedAspect ? pointsById.get(selectedAspect.from) : null;
  const toPoint = selectedAspect ? pointsById.get(selectedAspect.to) : null;
  const housePrefix = dictionary.result.transitPage.housePrefix.toLowerCase();

  return (
    <AnimatePresence>
      {selectedAspect && fromPoint && toPoint ? (
        <motion.div
          key={selectedAspect.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4"
        >
          <div className="relative w-[min(520px,calc(100vw-2rem))] rounded-[1rem] border border-dusty-gold/28 bg-[#fffaf0]/95 px-5 py-5 text-[#1e1a2e] shadow-[0_18px_50px_rgba(30,26,46,0.2)] backdrop-blur-[14px] sm:px-6">
            <button
              type="button"
              onClick={() => selectAspect(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center border border-black/10 bg-white/60 text-[15px] leading-none text-[#3a3048] transition hover:border-dusty-gold/40 hover:bg-white hover:text-[#5c4a24]"
              aria-label={dictionary.common.close}
            >
              x
            </button>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/74 font-serif text-[1.5rem] leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
                  style={{ color: fromPoint.color }}
                >
                  {fromPoint.glyph}
                </span>
                <span className="mt-2 truncate font-serif text-[15px] leading-none text-[#1e1a2e]">
                  {dictionary.result.points[fromPoint.id]}
                </span>
                <span className="mt-1 truncate text-[12px] text-[#3a3048]">
                  {dictionary.result.signs[fromPoint.sign]} {"\u00b7"} {housePrefix} {fromPoint.house}
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span className="font-serif text-[1.6rem] leading-none text-[#5c4a24]">
                  {dictionary.result.aspectSymbols[selectedAspect.type]}
                </span>
                <span className="max-w-[8rem] truncate text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048]">
                  {dictionary.result.aspectTypes[selectedAspect.type]}
                </span>
                <span className="border border-dusty-gold/24 bg-dusty-gold/10 px-2.5 py-1 text-[12px] font-semibold text-[#5c4a24]">
                  {selectedAspect.orb.toFixed(1)}
                  {"\u00b0"}
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/74 font-serif text-[1.5rem] leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
                  style={{ color: toPoint.color }}
                >
                  {toPoint.glyph}
                </span>
                <span className="mt-2 truncate font-serif text-[15px] leading-none text-[#1e1a2e]">
                  {dictionary.result.points[toPoint.id]}
                </span>
                <span className="mt-1 truncate text-[12px] text-[#3a3048]">
                  {dictionary.result.signs[toPoint.sign]} {"\u00b7"} {housePrefix} {toPoint.house}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
