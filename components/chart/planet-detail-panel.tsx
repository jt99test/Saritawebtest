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

import { useChartStore } from "@/components/chart/chart-store";

type Props = {
  chart: NatalChartData;
  dictionary: Dictionary;
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
    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-dusty-gold/72">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-white/8 py-3 last:border-b-0">
      <dt className="text-sm text-ivory/48">{label}</dt>
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

export function PlanetDetailPanel({ chart, dictionary }: Props) {
  const {
    selectedPointId,
    hoveredAspectId,
    detailTab,
    panelOpen,
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
  const isDesktop = useDesktopBreakpoint();

  const augmentedPoints = useMemo(() => getAugmentedChartPoints(chart), [chart]);
  const point = augmentedPoints.find((entry) => entry.id === selectedPointId) ?? null;
  const pointAspects = useMemo(
    () =>
      point
        ? chart.aspects
            .filter((aspect) => aspect.from === point.id || aspect.to === point.id)
            .sort((left, right) => left.orb - right.orb)
        : [],
    [chart.aspects, point],
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
          body: JSON.stringify({ chart, pointId: selectedPointId }),
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

          setReading((current) => current + decoder.decode(value, { stream: true }));
        }
      } catch (issue: unknown) {
        if ((issue as Error).name !== "AbortError") {
          setError(dictionary.loading.errorFallback);
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [chart, dictionary.loading.errorFallback, hoverAspect, panelOpen, selectedPointId]);

  useEffect(() => {
    if (!panelOpen) {
      prevPointRef.current = null;
      abortRef.current?.abort();
      hoverAspect(null);
      setReadingExpanded(false);
    }
  }, [hoverAspect, panelOpen]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closePanel, panelOpen]);

  if (!point) {
    return null;
  }

  const signMeta = getSignMeta(point.sign);
  const signGlyph = zodiacSigns.find((sign) => sign.id === point.sign)?.glyph ?? "";
  const position = formatSignPosition(point.longitude);
  const selectedHouseArea = houseArea(dictionary, point.house);
  const paragraphs = reading
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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
          <motion.button
            type="button"
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[4px]"
            onClick={closePanel}
            aria-label={dictionary.common.close}
          />

          <motion.aside
            key="drawer-panel"
            initial={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className={[
              "fixed z-50 overflow-hidden border-white/10 bg-[rgba(20,10,35,0.95)] backdrop-blur-xl",
              isDesktop
                ? "right-0 top-0 h-screen w-[420px] border-l border-l-dusty-gold/55 shadow-[-24px_0_90px_rgba(0,0,0,0.42)]"
                : "inset-x-0 bottom-0 h-[75vh] rounded-t-[2rem] border-t border-t-dusty-gold/50 shadow-[0_-24px_90px_rgba(0,0,0,0.42)]",
            ].join(" ")}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-white/8 px-5 pb-4 pt-4 sm:px-6">
                {!isDesktop ? <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/14" /> : null}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-dusty-gold/72">
                      {dictionary.result.panels.selectedPoint}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[2.25rem] leading-none" style={{ color: point.color }}>
                        {point.glyph}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-serif text-[2rem] leading-none text-ivory">
                          {dictionary.result.points[point.id]}
                        </h2>
                        <p className="mt-2 text-sm text-ivory/60">
                          {dictionary.result.signs[point.sign]} · {dictionary.result.fields.house} {point.house} ·{" "}
                          {selectedHouseArea}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-full border border-white/10 p-2.5 text-ivory/55 transition hover:border-white/16 hover:text-ivory"
                    aria-label={dictionary.common.close}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <p className="mt-4 text-sm leading-7 text-ivory/72">
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
                          "rounded-full border px-3.5 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] transition",
                          active
                            ? "border-dusty-gold/48 bg-dusty-gold/14 text-ivory"
                            : "border-white/10 bg-white/[0.03] text-ivory/52 hover:border-white/16 hover:text-ivory",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 sm:px-6">
                {detailTab === "essence" ? (
                  <div className="space-y-6">
                    <section className="rounded-[1.6rem] border border-dusty-gold/18 bg-white/[0.03] p-5">
                      <SectionLabel>{dictionary.result.drawer.summaryLabel}</SectionLabel>
                      <p className="mt-4 text-base leading-8 text-ivory/82">
                        <span className="text-ivory">{dictionary.result.points[point.id]}</span>{" "}
                        {dictionary.result.editorial.summaryMiddle}{" "}
                        <span className="text-ivory">{dictionary.result.signs[point.sign]}</span>{" "}
                        {dictionary.result.editorial.summarySuffix}{" "}
                        <span className="text-ivory">{selectedHouseArea}</span>.
                      </p>
                    </section>

                    <div className="grid gap-4">
                      <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                        <SectionLabel>{dictionary.result.editorial.signFocus}</SectionLabel>
                        <h3 className="mt-4 font-serif text-2xl text-ivory">
                          {dictionary.result.signs[point.sign]}
                        </h3>
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-ivory/68">
                          {essenceItems.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-dusty-gold/76" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                        <SectionLabel>{dictionary.result.editorial.houseFocus}</SectionLabel>
                        <h3 className="mt-4 font-serif text-2xl text-ivory">{selectedHouseArea}</h3>
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-ivory/68">
                          {manifestationItems.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-dusty-gold/76" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                ) : null}

                {detailTab === "data" ? (
                  <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                    <SectionLabel>{dictionary.result.editorial.technicalSheet}</SectionLabel>
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
                                ? "border-dusty-gold/52 bg-dusty-gold/12 shadow-[0_0_0_1px_rgba(232,197,71,0.15)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-base text-ivory">{title}</p>
                                <p className="mt-1 text-sm text-ivory/56">
                                  {dictionary.result.points[point.id]} · {counterpart}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82">
                                {aspect.orb.toFixed(1)}°
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="rounded-[1.45rem] border border-dashed border-white/12 px-4 py-4 text-sm leading-7 text-ivory/56">
                        {dictionary.result.messages.noAspectSelected}
                      </p>
                    )}
                  </section>
                ) : null}

                {detailTab === "reading" ? (
                  <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                    <SectionLabel>{dictionary.result.drawer.readingLabel}</SectionLabel>

                    {loading ? (
                      <div className="mt-4 space-y-2">
                        {[88, 76, 91, 64].map((width) => (
                          <div
                            key={width}
                            className="h-3 animate-pulse rounded-full bg-white/8"
                            style={{ width: `${width}%` }}
                          />
                        ))}
                      </div>
                    ) : null}

                    {error ? (
                      <p className="mt-4 text-sm leading-7 text-ivory/56">{error}</p>
                    ) : null}

                    {!loading && !error && previewParagraph ? (
                      <div className="mt-4 space-y-4 font-serif text-sm leading-8 text-ivory/74">
                        <p>{previewParagraph}</p>
                        {readingExpanded ? remainingParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : null}
                        {remainingParagraphs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setReadingExpanded((current) => !current)}
                            className="rounded-full border border-white/10 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ivory/62 transition hover:border-dusty-gold/26 hover:text-ivory"
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
