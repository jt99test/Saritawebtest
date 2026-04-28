"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { formatSignPosition, type ChartPointId, type NatalChartData } from "@/lib/chart";
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
  pointId: ChartPointId | "ascendant";
  glyph: string;
};

const GATE_GLYPHS: Partial<Record<ChartPointId | "ascendant", string>> = {
  sun: "\u2609",
  moon: "\u263d",
  venus: "\u2640",
  mercury: "\u263f",
  northNode: "\u260a",
  saturn: "\u2644",
  mars: "\u2642",
  jupiter: "\u2643",
  uranus: "\u2645",
  neptune: "\u2646",
  pluto: "\u2647",
  ascendant: "AC",
};

const GATE_META_BY_THEME: Partial<Record<GeneralReadingTheme, GateMeta>> = {
  "tu-esencia": { pointId: "sun", glyph: "☉" },
  "como-sientes": { pointId: "moon", glyph: "☽" },
  "que-das-valor": { pointId: "venus", glyph: "♀" },
  "como-piensas": { pointId: "mercury", glyph: "☿" },
  "tu-proposito": { pointId: "northNode", glyph: "☊" },
  "tus-desafios": { pointId: "saturn", glyph: "♄" },
  "tu-ascendente": { pointId: "ascendant", glyph: "AC" },
  "como-actuas": { pointId: "mars", glyph: "♂" },
  "donde-creces": { pointId: "jupiter", glyph: "♃" },
  "donde-rompes-esquemas": { pointId: "uranus", glyph: "♅" },
  "donde-suenas": { pointId: "neptune", glyph: "♆" },
  "donde-transformas": { pointId: "pluto", glyph: "♇" },
};

const GATE_META_BY_TITLE: Array<{ needle: string; meta: GateMeta }> = [
  { needle: "esencia", meta: { pointId: "sun", glyph: "☉" } },
  { needle: "ascendente", meta: { pointId: "ascendant", glyph: "AC" } },
  { needle: "sientes", meta: { pointId: "moon", glyph: "☽" } },
  { needle: "amas", meta: { pointId: "venus", glyph: "♀" } },
  { needle: "valor", meta: { pointId: "venus", glyph: "♀" } },
  { needle: "piensas", meta: { pointId: "mercury", glyph: "☿" } },
  { needle: "propósito", meta: { pointId: "northNode", glyph: "☊" } },
  { needle: "proposito", meta: { pointId: "northNode", glyph: "☊" } },
  { needle: "desafíos", meta: { pointId: "saturn", glyph: "♄" } },
  { needle: "desafios", meta: { pointId: "saturn", glyph: "♄" } },
  { needle: "actúas", meta: { pointId: "mars", glyph: "♂" } },
  { needle: "actuas", meta: { pointId: "mars", glyph: "♂" } },
  { needle: "creces", meta: { pointId: "jupiter", glyph: "♃" } },
  { needle: "rompes", meta: { pointId: "uranus", glyph: "♅" } },
  { needle: "sueñas", meta: { pointId: "neptune", glyph: "♆" } },
  { needle: "suenas", meta: { pointId: "neptune", glyph: "♆" } },
  { needle: "transformas", meta: { pointId: "pluto", glyph: "♇" } },
];

function gateMetaFor(theme: GeneralReadingTheme, title: string): GateMeta {
  const byTheme = GATE_META_BY_THEME[theme];
  if (byTheme) {
    return byTheme;
  }

  const normalized = title.toLowerCase();
  return GATE_META_BY_TITLE.find((entry) => normalized.includes(entry.needle))?.meta ?? {
    pointId: "sun",
    glyph: "☉",
  };
}

function subtitleFor(pointId: ChartPointId | "ascendant", chart: NatalChartData, dictionary: Dictionary) {
  if (pointId === "ascendant") {
    const sign = dictionary.result.signs[formatSignPosition(chart.meta.ascendant).sign];
    return sign ? `Ascendente en ${sign}` : "Ascendente";
  }

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
    <section className="pb-12 lg:pb-14">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          tu carta, en esencia
        </p>
        <h2 className="mt-1.5 font-serif text-[30px] font-normal leading-tight text-ivory lg:text-[36px]">
          Puertas de entrada
        </h2>
      </div>

      <div className="mx-auto mt-7 max-w-[700px] lg:mt-8">
        {cards.map((card, index) => {
          const expanded = expandedId === card.id;
          const cachedContent = cachedReadings[card.theme] ?? "";
          const streamingContent = streamingReadings[card.theme] ?? "";
          const loading = !!loadingThemes[card.theme];
          const error = errors[card.theme];
          const fullReading = cachedContent || streamingContent;
          const paragraphs = fullReading ? splitReadingParagraphs(fullReading) : [];
          const gateMeta = gateMetaFor(card.theme, card.title);
          const actionLabel = loading
            ? dictionary.result.generalReading.generating
            : cachedContent
              ? expanded
                ? "Leer —"
                : "Leer +"
              : expanded
                ? "Generar —"
                : "Generar +";

          return (
            <article
              key={card.id}
              className={[
                "border-t-[0.5px] border-dusty-gold/15",
                index === cards.length - 1 ? "border-b-[0.5px]" : "",
              ].join(" ")}
            >
              <button
                type="button"
                className="group grid w-full cursor-pointer grid-cols-[48px_minmax(0,1fr)_112px] items-center gap-4 py-4.5 text-left transition duration-200 hover:bg-dusty-gold/[0.03] sm:grid-cols-[56px_minmax(0,1fr)_140px] lg:grid-cols-[64px_minmax(0,1fr)_144px] lg:py-5"
                onClick={() => {
                  setExpandedId(expanded ? null : card.id);
                  if (!cachedContent && !streamingContent && !loading) {
                    void generateReading(card.theme);
                  }
                }}
                aria-expanded={expanded}
              >
                <span className="text-center font-serif text-[28px] text-[rgba(255,255,255,0.58)] lg:text-[32px]">
                  {GATE_GLYPHS[gateMeta.pointId] ?? gateMeta.glyph}
                </span>
                <span>
                  <span className="block font-serif text-[21px] font-normal text-white lg:text-[24px]">
                    {card.title}
                  </span>
                  <span className="mt-1 block font-serif text-[13px] italic text-[rgba(255,255,255,0.5)] lg:text-sm">
                    {subtitleFor(gateMeta.pointId, chart, dictionary)}
                  </span>
                </span>
                <span
                  className={[
                    "inline-flex min-h-9 items-center justify-center px-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] transition",
                    loading
                      ? "border-transparent bg-transparent px-0 text-dusty-gold/80"
                      : cachedContent
                        ? "border border-white/10 bg-white/[0.025] text-ivory/62 group-hover:border-dusty-gold/30 group-hover:text-dusty-gold/86"
                        : "border border-dusty-gold/28 bg-dusty-gold/[0.07] text-dusty-gold/88 shadow-[0_12px_32px_rgba(0,0,0,0.18)] group-hover:border-dusty-gold/50 group-hover:bg-dusty-gold/[0.11]",
                  ].join(" ")}
                >
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
                <div className="max-w-[600px] pb-5 pl-[64px] sm:pl-[76px] lg:pl-[84px]">
                  {error ? (
                    <div className="space-y-4">
                      <p className="font-serif text-[17px] leading-[1.75] text-[rgba(255,255,255,0.85)] lg:text-lg lg:leading-[1.8]">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={() => void generateReading(card.theme)}
                        className="inline-flex items-center justify-center border border-dusty-gold/28 bg-dusty-gold/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-dusty-gold/86 transition hover:border-dusty-gold/50 hover:bg-dusty-gold/[0.11]"
                      >
                        {dictionary.result.generalReading.retry} ↓
                      </button>
                    </div>
                  ) : fullReading ? (
                    <div className="space-y-5">
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
