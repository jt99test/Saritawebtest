"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  formatSignPosition,
  getAugmentedChartPoints,
  getSignMeta,
  zodiacSigns,
  type Aspect,
  type ChartPointId,
  type NatalChartData,
} from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import type { ReadingGender } from "@/lib/reading-gender";
import { normalizeReadingText } from "@/lib/reading-text";

import { useChartStore } from "@/components/chart/chart-store";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { RenderedReading, splitReadingParagraphs } from "@/components/ui/rendered-reading";

type Props = {
  chart: NatalChartData;
  dictionary: Dictionary;
  readingId?: string;
  gender?: ReadingGender;
};

const PANEL_POINT_COLORS: Partial<Record<ChartPointId, string>> = {
  sun: "#b88400",
  moon: "#6c7286",
  mercury: "#3a8a76",
  venus: "#9b5fb7",
  mars: "#b74337",
  jupiter: "#8a6a25",
  saturn: "#77724d",
  uranus: "#347f91",
  neptune: "#4d61b2",
  pluto: "#7e4b91",
  northNode: "#b88400",
  southNode: "#a87900",
  chiron: "#6e8b55",
  partOfFortune: "#8a6a25",
  lilith: "#7e4b91",
  ceres: "#6e8b55",
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

function SectionLabel({ children }: { children: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#5c4a24]">
        {children}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-black/10 py-3 last:border-b-0">
      <dt className="text-sm text-[#3a3048]">{label}</dt>
      <dd className="text-right text-sm text-ivory/88">{value}</dd>
    </div>
  );
}

function houseArea(dictionary: Dictionary, house: number) {
  const key = String(house) as keyof typeof dictionary.result.houseMeanings;
  return dictionary.result.houseMeanings[key];
}

function formatAspectLabel(dictionary: Dictionary, aspect: Aspect, pointId: ChartPointId) {
  const otherId = aspect.from === pointId ? aspect.to : aspect.from;
  return {
    title: dictionary.result.aspectTypes[aspect.type],
    counterpart: dictionary.result.points[otherId],
  };
}

export function PlanetDetailPanel({ chart, dictionary, readingId, gender }: Props) {
  const locale = useStoredLocale();
  const {
    selectedPointId,
    hoveredAspectId,
    detailTab,
    panelOpen,
    showMinorAspects,
    closePanel,
    hoverAspect,
    setDetailTab,
  } = useChartStore();
  const [reading, setReading] = useState("");
  const [readingExpanded, setReadingExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevPointRef = useRef<ChartPointId | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isDesktop = useDesktopBreakpoint();

  const augmentedPoints = useMemo(() => getAugmentedChartPoints(chart), [chart]);
  const point = augmentedPoints.find((entry) => entry.id === selectedPointId) ?? null;
  const pointAspects = useMemo(
    () =>
      point
        ? chart.aspects
            .filter((aspect) => {
              if (!(aspect.from === point.id || aspect.to === point.id)) {
                return false;
              }

              return aspect.type === "quincunx" ? showMinorAspects : true;
            })
            .sort((left, right) => left.orb - right.orb)
        : [],
    [chart.aspects, point, showMinorAspects],
  );

  useEffect(() => {
    if (!panelOpen || !selectedPointId || selectedPointId === prevPointRef.current) {
      return;
    }

    prevPointRef.current = selectedPointId;
    abortRef.current?.abort();
    hoverAspect(null);

    const controller = new AbortController();
    abortRef.current = controller;

    setReading("");
    setError(null);
    setLoading(true);
    setReadingExpanded(false);

    (async () => {
      try {
        const response = await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chart, pointId: selectedPointId, locale, readingId, gender }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          setError(dictionary.loading.errorFallback);
          setLoading(false);
          return;
        }

        setLoading(false);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          setReading((current) => normalizeReadingText(current + decoder.decode(value, { stream: true })));
        }
      } catch (issue: unknown) {
        if ((issue as Error).name !== "AbortError") {
          setError(dictionary.loading.errorFallback);
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [chart, dictionary.loading.errorFallback, gender, hoverAspect, locale, panelOpen, readingId, selectedPointId]);

  useEffect(() => {
    if (!panelOpen) {
      abortRef.current?.abort();
      hoverAspect(null);
      const returnToId = prevPointRef.current;
      prevPointRef.current = null;

      if (returnToId) {
        requestAnimationFrame(() => {
          const trigger = document.querySelector<HTMLElement>(`[data-chart-point="${returnToId}"]`);
          trigger?.focus();
        });
      }

      return;
    }

    const panel = panelRef.current;
    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || panel?.contains(target) || target.closest("[data-chart-point]")) {
        return;
      }

      closePanel();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closePanel, hoverAspect, panelOpen]);

  if (!point) {
    return null;
  }

  const signMeta = getSignMeta(point.sign);
  const signGlyph = zodiacSigns.find((sign) => sign.id === point.sign)?.glyph ?? "";
  const pointColor = PANEL_POINT_COLORS[point.id] ?? point.color;
  const position = formatSignPosition(point.longitude);
  const selectedHouseArea = houseArea(dictionary, point.house);
  const paragraphs = splitReadingParagraphs(reading);
  const previewParagraph = paragraphs[0] ?? "";
  const remainingParagraphs = paragraphs.slice(1);
  const essenceItems = [
    `${dictionary.result.signs[point.sign]} · ${dictionary.result.elements[signMeta.element]}`,
    dictionary.result.editorial.signPrompts[point.sign],
  ];
  const manifestationItems = [
    `${dictionary.result.fields.house} ${point.house} · ${selectedHouseArea}`,
    dictionary.result.editorial.housePrompts[String(point.house) as keyof typeof dictionary.result.editorial.housePrompts],
    point.retrograde
      ? dictionary.result.editorial.retrogradeActive
      : dictionary.result.editorial.retrogradeDirect,
  ];
  const drawerTabs = [
    { id: "essence", label: dictionary.result.drawer.tabs.essence },
    { id: "data", label: dictionary.result.drawer.tabs.data },
    { id: "aspects", label: dictionary.result.drawer.tabs.aspects },
    { id: "reading", label: dictionary.result.drawer.tabs.reading },
  ] as const;

  return (
    <AnimatePresence>
      {panelOpen ? (
        <>
          {!isDesktop ? (
            <button
              type="button"
              aria-label={dictionary.common.close}
              onClick={closePanel}
              className="fixed inset-x-0 top-0 z-30 h-[32vh] bg-black/0"
            />
          ) : null}
          <motion.aside
            key="drawer-panel"
            initial={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className={[
              "fixed z-40 overflow-hidden border-black/10 bg-cosmic-950/97 text-ivory backdrop-blur-[12px]",
              isDesktop
                ? "right-4 top-[104px] h-[calc(100vh-120px)] w-[360px] rounded-[1.4rem] border shadow-[-18px_18px_70px_rgba(0,0,0,0.16)]"
                : "inset-x-0 bottom-0 h-[min(74svh,calc(100svh-4.5rem))] rounded-t-[1.5rem] border-t shadow-[0_-24px_90px_rgba(0,0,0,0.18)]",
            ].join(" ")}
            aria-modal="false"
            role="dialog"
            aria-label={dictionary.result.panels.selectedPoint}
          >
            <div ref={panelRef} className="flex h-full flex-col">
              <div className="border-b border-black/10 px-5 pb-4 pt-4 sm:px-6">
                {!isDesktop ? <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-black/12" /> : null}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#5c4a24]">
                      {dictionary.result.panels.selectedPoint}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[2.25rem] leading-none" style={{ color: pointColor }}>
                        {point.glyph}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-serif text-[2rem] leading-none text-ivory">
                          {dictionary.result.points[point.id]}
                        </h2>
                        <p className="mt-2 text-sm text-[#3a3048]">
                          {dictionary.result.signs[point.sign]} · {dictionary.result.fields.house} {point.house} ·{" "}
                          {selectedHouseArea}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closePanel}
                    className="rounded-full border border-black/10 bg-white/70 p-2.5 text-[#3a3048] transition hover:border-black/15 hover:bg-white hover:text-ivory"
                    aria-label={dictionary.common.close}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#3a3048]">
                  <span className="text-ivory">{dictionary.result.points[point.id]}</span>{" "}
                  {dictionary.result.editorial.summaryMiddle}{" "}
                  <span className="text-ivory">{dictionary.result.signs[point.sign]}</span>{" "}
                  {dictionary.result.editorial.summarySuffix}{" "}
                  <span className="text-ivory">{selectedHouseArea}</span>.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {drawerTabs.map((tab) => {
                    const active = detailTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDetailTab(tab.id)}
                        className={[
                          "rounded-full border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.24em] transition",
                          active
                            ? "border-dusty-gold/55 bg-dusty-gold/14 text-[#5c4a24]"
                            : "border-black/10 bg-white/45 text-[#3a3048] hover:border-black/15 hover:bg-white hover:text-ivory",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
                {detailTab === "essence" ? (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <section className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-none">
                        <SectionLabel>{dictionary.result.editorial.signFocus}</SectionLabel>
                        <h3 className="mt-4 font-serif text-2xl text-ivory">
                          {dictionary.result.signs[point.sign]}
                        </h3>
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-[#3a3048]">
                          {essenceItems.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-ivory/35" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-none">
                        <SectionLabel>{dictionary.result.editorial.houseFocus}</SectionLabel>
                        <h3 className="mt-4 font-serif text-2xl text-ivory">{selectedHouseArea}</h3>
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-[#3a3048]">
                          {manifestationItems.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-ivory/35" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                ) : null}

                {detailTab === "data" ? (
                  <section className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-none">
                    <SectionLabel>{dictionary.result.editorial.technicalSheet}</SectionLabel>
                    {point.id === "northNode" || point.id === "southNode" ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-dusty-gold/20 bg-dusty-gold/8 px-3 py-2 text-xs leading-6 text-[#3a3048]">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dusty-gold/30 text-[12px] text-[#5c4a24]">
                          ⓘ
                        </span>
                        <span>{dictionary.result.messages.meanNodeNote}</span>
                      </div>
                    ) : null}
                    <dl className="mt-4">
                      <InfoRow label={dictionary.result.fields.position} value={point.degreeLabel} />
                      <InfoRow
                        label={dictionary.result.fields.zodiacPosition}
                        value={`${position.degreeInSign}° ${String(position.minutesInSign).padStart(2, "0")}′ ${signGlyph}`}
                      />
                      <InfoRow label={dictionary.result.fields.eclipticLongitude} value={point.absoluteLongitudeLabel} />
                      <InfoRow label={dictionary.result.fields.sign} value={dictionary.result.signs[point.sign]} />
                      <InfoRow label={dictionary.result.fields.house} value={String(point.house)} />
                      <InfoRow label={dictionary.result.fields.element} value={dictionary.result.elements[signMeta.element]} />
                      <InfoRow
                        label={dictionary.result.fields.modality}
                        value={dictionary.result.modalities[signMeta.modality]}
                      />
                      <InfoRow label={dictionary.result.fields.houseMeaning} value={selectedHouseArea} />
                      <InfoRow
                        label={dictionary.result.fields.retrograde}
                        value={point.retrograde ? dictionary.common.yes : dictionary.common.no}
                      />
                    </dl>
                  </section>
                ) : null}

                {detailTab === "aspects" ? (
                  <section className="space-y-4">
                    {pointAspects.length > 0 ? (
                      pointAspects.map((aspect) => {
                        const { title, counterpart } = formatAspectLabel(dictionary, aspect, point.id);
                        const active = hoveredAspectId === aspect.id;

                        return (
                          <button
                            key={aspect.id}
                            type="button"
                            onClick={() => hoverAspect(active ? null : aspect.id)}
                            className={[
                              "w-full rounded-[1.45rem] border p-4 text-left transition",
                              active
                                ? "border-dusty-gold/55 bg-dusty-gold/12 shadow-[0_0_0_1px_rgba(111,90,42,0.1)]"
                                : "border-black/10 bg-white shadow-none hover:border-black/15 hover:bg-black/[0.04]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-base text-ivory">{title}</p>
                                <p className="mt-1 text-sm text-[#3a3048]">
                                  {dictionary.result.points[point.id]} · {counterpart}
                                </p>
                              </div>
                              <span className="rounded-full border border-black/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24]">
                                {aspect.orb.toFixed(1)}°
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="rounded-[1.45rem] border border-dashed border-black/15 px-4 py-4 text-sm leading-7 text-[#3a3048]">
                        {dictionary.result.messages.noAspectSelected}
                      </p>
                    )}
                  </section>
                ) : null}

                {detailTab === "reading" ? (
                  <section className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-none">
                    <SectionLabel>{dictionary.result.drawer.readingLabel}</SectionLabel>

                    {loading ? (
                      <div className="mt-4 space-y-2">
                        {[88, 76, 91, 64].map((width) => (
                          <div
                            key={width}
                            className="h-3 animate-pulse rounded-full bg-black/10"
                            style={{ width: `${width}%` }}
                          />
                        ))}
                      </div>
                    ) : null}

                    {error ? (
                      <p className="mt-4 text-sm leading-7 text-[#3a3048]">{error}</p>
                    ) : null}

                    {!loading && !error && previewParagraph ? (
                      <div className="mt-4">
                        <RenderedReading
                          paragraphs={readingExpanded ? paragraphs : [previewParagraph]}
                          className="font-serif text-sm text-ivory/74"
                        />
                        {remainingParagraphs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setReadingExpanded((current) => !current)}
                            className="mt-6 rounded-full border border-dusty-gold/24 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#5c4a24] transition hover:border-dusty-gold/42 hover:text-ivory"
                          >
                            {readingExpanded ? dictionary.common.hide : dictionary.result.drawer.readMore}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
