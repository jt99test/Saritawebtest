"use client";

import { AnimatePresence, motion } from "motion/react";

import { getAugmentedChartPoints, type NatalChartData } from "@/lib/chart";
import { getDictionary } from "@/lib/i18n";
import { useChartStore } from "@/components/chart/chart-store";

const dictionary = getDictionary("es");

type Props = {
  chart: NatalChartData;
};

export function AspectDetailPanel({ chart }: Props) {
  const { selectedAspect, selectAspect } = useChartStore();

  const allPoints = getAugmentedChartPoints(chart);
  const pointsById = new Map(allPoints.map((point) => [point.id, point] as const));

  const fromPoint = selectedAspect ? pointsById.get(selectedAspect.from) : null;
  const toPoint = selectedAspect ? pointsById.get(selectedAspect.to) : null;

  return (
    <AnimatePresence>
      {selectedAspect && fromPoint && toPoint ? (
        <motion.div
          key={selectedAspect.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="relative min-w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-[rgba(236,232,223,0.1)] bg-[rgba(8,11,18,0.97)] px-6 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-[16px]">
            <button
              type="button"
              onClick={() => selectAspect(null)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[18px] leading-none text-ivory/35 transition hover:text-ivory/80"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-[1.5rem] leading-none" style={{ color: fromPoint.color }}>
                  {fromPoint.glyph}
                </span>
                <span className="mt-1.5 font-serif text-[15px] leading-none text-ivory">
                  {dictionary.result.points[fromPoint.id]}
                </span>
                <span className="mt-1 text-[11px] text-ivory/45">
                  {dictionary.result.signs[fromPoint.sign]} · casa {fromPoint.house}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <span className="font-serif text-[1.6rem] leading-none text-ivory/90">
                  {dictionary.result.aspectSymbols[selectedAspect.type]}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-ivory/50">
                  {dictionary.result.aspectTypes[selectedAspect.type]}
                </span>
                <span className="text-[11px] text-dusty-gold/82">
                  {selectedAspect.orb.toFixed(1)}°
                </span>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span className="font-serif text-[1.5rem] leading-none" style={{ color: toPoint.color }}>
                  {toPoint.glyph}
                </span>
                <span className="mt-1.5 font-serif text-[15px] leading-none text-ivory">
                  {dictionary.result.points[toPoint.id]}
                </span>
                <span className="mt-1 text-[11px] text-ivory/45">
                  {dictionary.result.signs[toPoint.sign]} · casa {toPoint.house}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
