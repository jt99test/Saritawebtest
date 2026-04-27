"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import type { ChartPointId, NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import { getGeneralReadingCards } from "@/data/chart-readings";
import { hashNatalChart } from "@/lib/chart-hash";
import { GENERAL_READING_THEMES, type GeneralReadingTheme } from "@/lib/general-reading";
import { getAllCachedReadings, setCachedReading } from "@/lib/general-reading-cache";
import { splitReadingParagraphs } from "@/components/ui/rendered-reading";

type ChartGeneralReadingProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

type GateMeta = {
  pointId: ChartPointId;
  glyph: string;
};

const GATE_META_BY_TITLE: Array<{ needle: string; meta: GateMeta }> = [
  { needle: "esencia", meta: { pointId: "sun", glyph: "☉" } },
  { needle: "sientes", meta: { pointId: "moon", glyph: "☽" } },
  { needle: "amas", meta: { pointId: "venus", glyph: "♀" } },
  { needle: "piensas", meta: { pointId: "mercury", glyph: "☿" } },
  { needle: "propósito", meta: { pointId: "northNode", glyph: "☊" } },
  { needle: "proposito", meta: { pointId: "northNode", glyph: "☊" } },
  { needle: "desafíos", meta: { pointId: "saturn", glyph: "♄" } },
  { needle: "desafios", meta: { pointId: "saturn", glyph: "♄" } },
];

function gateMetaFor(title: string): GateMeta {
  const normalized = title.toLowerCase();
  return GATE_META_BY_TITLE.find((entry) => normalized.includes(entry.needle))?.meta ?? {
    pointId: "sun",
    glyph: "☉",
  };
}

function subtitleFor(pointId: ChartPointId, chart: NatalChartData, dictionary: Dictionary) {
  const point = chart.points.find((entry) => entry.id === pointId);

  if (!point) {
    return "";
  }

  return `${dictionary.result.points[point.id]} en ${dictionary.result.signs[point.sign]} · Casa ${point.house}`;
}

export function ChartGeneralReading({ chart, dictionary }: ChartGeneralReadingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chartHash, setChartHash] = useState<string | null>(null);
  const [cachedReadings, setCachedReadings] = useState<Record<string, string>>({});
  const [streamingReadings, setStreamingReadings] = useState<Record<string, string>>({});
  const [loadingThemes, setLoadingThemes] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const controllersRef = useRef<Record<string, AbortController>>({});
  const cards = getGeneralReadingCards(chart, dictionary);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const nextHash = await hashNatalChart(chart);
      if (cancelled) {
        return;
      }

      setChartHash(nextHash);
      setCachedReadings(getAllCachedReadings(nextHash));
      setStreamingReadings({});
      setLoadingThemes({});
      setErrors({});
      setExpandedId(null);
    })();

    return () => {
      cancelled = true;
      Object.values(controllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
    };
  }, [chart]);

  async function generateReading(theme: GeneralReadingTheme) {
    if (!chartHash || loadingThemes[theme]) {
      return false;
    }

    const controller = new AbortController();
    controllersRef.current[theme] = controller;

    setLoadingThemes((current) => ({ ...current, [theme]: true }));
    setErrors((current) => ({ ...current, [theme]: null }));
    setStreamingReadings((current) => ({ ...current, [theme]: "" }));

    try {
      const response = await fetch("/api/general-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chart, theme }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("No se pudo generar");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const readStream = async (content: string): Promise<string> => {
        const { done, value } = await reader.read();

        if (done) {
          return content;
        }

        const nextContent = content + decoder.decode(value, { stream: true });
        setStreamingReadings((current) => ({ ...current, [theme]: nextContent }));
        return readStream(nextContent);
      };

      const finalContent = (await readStream("")).trim();

      if (!finalContent) {
        throw new Error("No se pudo generar");
      }

      setCachedReading(chartHash, theme, finalContent);
      setCachedReadings((current) => ({ ...current, [theme]: finalContent }));
      setStreamingReadings((current) => ({ ...current, [theme]: finalContent }));
      return true;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setErrors((current) => ({ ...current, [theme]: "No se pudo generar. Intentar de nuevo" }));
      }

      return false;
    } finally {
      delete controllersRef.current[theme];
      setLoadingThemes((current) => ({ ...current, [theme]: false }));
    }
  }

  return (
    <section className="pb-24">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.5)]">
          tu carta, en esencia
        </p>
        <h2 className="mt-2 font-serif text-[36px] font-normal leading-tight text-ivory lg:text-[44px]">
          Seis puertas de entrada
        </h2>
      </div>

      <div className="mx-auto mt-14 max-w-[720px]">
        {cards.map((card, index) => {
          const expanded = expandedId === card.id;
          const cachedContent = cachedReadings[card.theme] ?? "";
          const streamingContent = streamingReadings[card.theme] ?? "";
          const loading = !!loadingThemes[card.theme];
          const error = errors[card.theme];
          const fullReading = cachedContent || streamingContent;
          const paragraphs = fullReading ? splitReadingParagraphs(fullReading) : [];
          const gateMeta = gateMetaFor(card.title);
          const actionLabel = cachedContent ? "Leer ↓" : "Generar ↓";

          return (
            <article
              key={card.id}
              className={[
                "border-t-[0.5px] border-[rgba(232,197,71,0.15)]",
                index === cards.length - 1 ? "border-b-[0.5px]" : "",
              ].join(" ")}
            >
              <button
                type="button"
                className="grid w-full cursor-pointer grid-cols-[60px_minmax(0,1fr)_120px] items-center gap-6 py-7 text-left transition duration-200 hover:bg-[rgba(232,197,71,0.03)] lg:grid-cols-[80px_minmax(0,1fr)_120px] lg:py-9"
                onClick={() => {
                  setExpandedId(expanded ? null : card.id);
                  if (!cachedContent && !streamingContent && !loading) {
                    void generateReading(card.theme);
                  }
                }}
                aria-expanded={expanded}
              >
                <span className="text-center font-serif text-[32px] text-[rgba(255,255,255,0.6)] lg:text-[36px]">
                  {gateMeta.glyph}
                </span>
                <span>
                  <span className="block font-serif text-2xl font-normal text-white lg:text-[28px]">
                    {card.title}
                  </span>
                  <span className="mt-1 block font-serif text-[13px] italic text-[rgba(255,255,255,0.5)] lg:text-sm">
                    {subtitleFor(gateMeta.pointId, chart, dictionary)}
                  </span>
                </span>
                <span className="text-right text-[13px] text-[rgba(232,197,71,0.8)]">
                  {actionLabel}
                </span>
              </button>

              <motion.div
                initial={false}
                animate={expanded ? "open" : "closed"}
                variants={{
                  open: { height: "auto", opacity: 1 },
                  closed: { height: 0, opacity: 0 },
                }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="max-w-[600px] pb-7 pl-[84px] lg:pl-[104px]">
                  {error ? (
                    <div className="space-y-4">
                      <p className="font-serif text-[17px] leading-[1.75] text-[rgba(255,255,255,0.85)] lg:text-lg lg:leading-[1.8]">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={() => void generateReading(card.theme)}
                        className="text-[13px] text-[rgba(232,197,71,0.8)] transition hover:text-ivory"
                      >
                        {dictionary.result.generalReading.retry} ↓
                      </button>
                    </div>
                  ) : fullReading ? (
                    <div className="space-y-5">
                      {loading ? (
                        <p className="text-[13px] uppercase tracking-[0.2em] text-[rgba(232,197,71,0.65)]">
                          {dictionary.result.generalReading.generating}
                        </p>
                      ) : null}
                      <div className="space-y-5">
                        {paragraphs.map((paragraph, paragraphIndex) => (
                          <p
                            key={`${card.id}-${paragraphIndex}`}
                            className="font-serif text-[17px] leading-[1.75] text-[rgba(255,255,255,0.85)] lg:text-lg lg:leading-[1.8]"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-[17px] leading-[1.75] text-[rgba(255,255,255,0.55)] lg:text-lg lg:leading-[1.8]">
                      {GENERAL_READING_THEMES.includes(card.theme)
                        ? dictionary.result.generalReading.placeholder
                        : ""}
                    </p>
                  )}
                </div>
              </motion.div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
