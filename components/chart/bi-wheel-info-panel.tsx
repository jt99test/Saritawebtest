"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import { ASPECT_LABELS, HOUSE_AREAS, POINT_LABELS, SIGN_LABELS } from "@/lib/chart-labels";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";
import type { SynastryAspect } from "@/lib/synastry";
import type { ActiveTransit } from "@/lib/transits.server";

export type BiWheelPanelVariant = "transits" | "solar-return" | "synastry";

type BiWheelInfoPanelProps = {
  variant: BiWheelPanelVariant;
  selectedId: ChartPointId | null;
  ring: "inner" | "outer";
  innerChart: NatalChartData;
  outerChart: NatalChartData | null;
  activeTransits?: ActiveTransit[];
  synastryAspects?: SynastryAspect[];
  innerName?: string;
  outerName?: string;
  onClose: () => void;
};

function useDesktopBreakpoint() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function selectedPoint(
  selectedId: ChartPointId | null,
  ring: "inner" | "outer",
  innerChart: NatalChartData,
  outerChart: NatalChartData | null,
) {
  if (!selectedId) {
    return null;
  }

  const chart = ring === "inner" ? innerChart : outerChart;
  return chart?.points.find((point) => point.id === selectedId) ?? null;
}

function ringLabel(
  variant: BiWheelPanelVariant,
  ring: "inner" | "outer",
  copy: ReturnType<typeof panelCopy>,
  innerName?: string,
  outerName?: string,
) {
  if (variant === "transits") {
    return ring === "inner" ? copy.natal : copy.transitNow;
  }

  if (variant === "solar-return") {
    return ring === "inner" ? copy.natal : copy.solarReturn;
  }

  return ring === "inner" ? (innerName ?? copy.you) : (outerName ?? copy.partner);
}

function panelCopy(locale: string) {
  if (locale === "en") {
    return {
      natal: "Natal",
      transitNow: "Transit now",
      solarReturn: "SR this year",
      you: "You",
      partner: "Partner",
      noNatalTransits: "No active transits right now.",
      noTransitAspects: "No active aspects with your chart.",
      angularHouse: "Angular house - important position this year.",
      noSynastryAspects: "No direct aspects with this position.",
    };
  }

  if (locale === "it") {
    return {
      natal: "Natale",
      transitNow: "Transito ora",
      solarReturn: "RS quest'anno",
      you: "Tu",
      partner: "Partner",
      noNatalTransits: "Nessun transito attivo ora.",
      noTransitAspects: "Nessun aspetto attivo con la tua carta.",
      angularHouse: "Casa angolare - posizione importante quest'anno.",
      noSynastryAspects: "Nessun aspetto diretto con questa posizione.",
    };
  }

  return {
    natal: "Natal",
    transitNow: "Tránsito ahora",
    solarReturn: "RS Este Año",
    you: "Tú",
    partner: "Pareja",
    noNatalTransits: "Sin tránsitos activos ahora.",
    noTransitAspects: "Sin aspectos activos con tu carta.",
    angularHouse: "Casa angular - posición de peso este año.",
    noSynastryAspects: "Sin aspectos directos con esta posición.",
  };
}

function TransitRows({
  ring,
  selectedId,
  copy,
  activeTransits = [],
}: {
  ring: "inner" | "outer";
  selectedId: ChartPointId;
  copy: ReturnType<typeof panelCopy>;
  activeTransits?: ActiveTransit[];
}) {
  const rows = activeTransits
    .filter((transit) => (ring === "inner" ? transit.natalPlanet === selectedId : transit.transitingPlanet === selectedId))
    .slice(0, 3);

  if (!rows.length) {
    return (
      <p className="text-[13px] text-[#3a3048]">
        {ring === "inner" ? copy.noNatalTransits : copy.noTransitAspects}
      </p>
    );
  }

  return (
    <div>
      {rows.map((transit) => {
        const rowLabel = ring === "inner"
          ? `${POINT_LABELS[transit.transitingPlanet]} ${ASPECT_LABELS[transit.aspectType].toLowerCase()}`
          : `${ASPECT_LABELS[transit.aspectType]} ${POINT_LABELS[transit.natalPlanet]} natal`;

        return (
          <div
            key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
            className="flex items-center justify-between gap-4 border-b border-black/[0.06] py-2.5 last:border-b-0"
          >
            <p className="text-[13px] text-ivory">{rowLabel}</p>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5c4a24]">
              {transit.orb.toFixed(1)}°
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SolarReturnNote({ point, copy }: { point: ChartPoint; copy: ReturnType<typeof panelCopy> }) {
  const angular = point.house === 1 || point.house === 4 || point.house === 7 || point.house === 10;
  return (
    <p className={angular ? "text-[13px] italic text-[#5c4a24]" : "text-[13px] italic text-[#3a3048]"}>
      {angular ? copy.angularHouse : HOUSE_AREAS[point.house]}
    </p>
  );
}

function qualityLabel(quality: SynastryAspect["quality"]) {
  if (quality === "harmonious") {
    return { label: "Armónico", className: "text-emerald-700" };
  }

  if (quality === "tense") {
    return { label: "Tenso", className: "text-red-700" };
  }

  return { label: "Neutro", className: "text-[#8a7a4e]" };
}

function SynastryRows({
  ring,
  selectedId,
  copy,
  synastryAspects = [],
}: {
  ring: "inner" | "outer";
  selectedId: ChartPointId;
  copy: ReturnType<typeof panelCopy>;
  synastryAspects?: SynastryAspect[];
}) {
  const rows = synastryAspects
    .filter((aspect) => (ring === "inner" ? aspect.pointA === selectedId : aspect.pointB === selectedId))
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 3);

  if (!rows.length) {
    return <p className="text-[13px] text-[#3a3048]">{copy.noSynastryAspects}</p>;
  }

  return (
    <div>
      {rows.map((aspect) => {
        const badge = qualityLabel(aspect.quality);
        const otherPoint = ring === "inner" ? aspect.pointB : aspect.pointA;
        return (
          <div
            key={`${aspect.pointA}-${aspect.pointB}-${aspect.type}`}
            className="flex items-center justify-between gap-4 border-b border-black/[0.06] py-2.5 last:border-b-0"
          >
            <p className="text-[13px] text-ivory">
              {ASPECT_LABELS[aspect.type]} {POINT_LABELS[otherPoint]} · {aspect.orb.toFixed(1)}°
            </p>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BiWheelInfoPanel({
  variant,
  selectedId,
  ring,
  innerChart,
  outerChart,
  activeTransits,
  synastryAspects,
  innerName,
  outerName,
  onClose,
}: BiWheelInfoPanelProps) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const copy = panelCopy(locale);
  const isDesktop = useDesktopBreakpoint();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const point = selectedPoint(selectedId, ring, innerChart, outerChart);

  useEffect(() => {
    if (!selectedId || !point) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || panelRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, point, selectedId]);

  return (
    <AnimatePresence>
      {selectedId && point ? (
        <motion.aside
          key={`${ring}-${selectedId}`}
          initial={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className={[
            "fixed z-40 overflow-y-auto border-black/10 bg-cosmic-950/97 backdrop-blur-[12px]",
            isDesktop
              ? "right-0 top-0 h-screen w-[340px] border-l shadow-[-24px_0_90px_rgba(0,0,0,0.18)]"
              : "inset-x-0 bottom-0 h-[52vh] rounded-t-[2rem] border-t shadow-[0_-24px_90px_rgba(0,0,0,0.18)]",
          ].join(" ")}
          role="dialog"
          aria-label={dictionary.result.points[selectedId]}
        >
          <div ref={panelRef} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                  {ringLabel(variant, ring, copy, innerName, outerName)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-serif text-[2rem] leading-none" style={{ color: point.color }}>
                    {point.glyph}
                  </span>
                  <div>
                    <h3 className="font-serif text-[22px] leading-none text-ivory">
                      {dictionary.result.points[selectedId]}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-[#3a3048]">
                      {SIGN_LABELS[point.sign]} · Casa {point.house} · {HOUSE_AREAS[point.house]}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 bg-white/70 p-2.5 text-[#3a3048] transition hover:border-black/15 hover:bg-white hover:text-ivory"
                aria-label="Cerrar"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-4 border-t border-black/[0.07] pt-4">
              {variant === "transits" ? (
                <TransitRows ring={ring} selectedId={selectedId} copy={copy} activeTransits={activeTransits} />
              ) : null}
              {variant === "solar-return" ? <SolarReturnNote point={point} copy={copy} /> : null}
              {variant === "synastry" ? (
                <SynastryRows ring={ring} selectedId={selectedId} copy={copy} synastryAspects={synastryAspects} />
              ) : null}
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
