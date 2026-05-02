"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { getGeneralReadingCards } from "@/data/chart-readings";
import { hashNatalChart } from "@/lib/chart-hash";
import { GENERAL_READING_THEMES, type GeneralReadingTheme } from "@/lib/general-reading";
import { getAllCachedReadings, setCachedReading } from "@/lib/general-reading-cache";
import type { NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import { normalizeReadingText, splitReading } from "@/lib/reading-text";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";

type ChartGeneralReadingProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

const PLAN_REQUIRED_ERROR = "SARITA_PLAN_REQUIRED";

function renderEmphasis(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <em key={`${match.index}-${match[0]}`} className="not-italic font-medium text-ivory">
        {match[2] ?? match[3] ?? match[4] ?? match[5]}
      </em>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const THEME_META: Record<GeneralReadingTheme, { glyph: string; label: string }> = {
  "tu-esencia": { glyph: "☉", label: "Esencia" },
  "como-sientes": { glyph: "☽", label: "Emociones" },
  "que-das-valor": { glyph: "♀", label: "Valores" },
  "como-piensas": { glyph: "☿", label: "Mente" },
  "tu-proposito": { glyph: "☊", label: "Propósito" },
  "lo-que-suelto": { glyph: "☋", label: "Lo que sueltas" },
  "tu-herida-medicina": { glyph: "⚷", label: "Herida" },
  "tus-desafios": { glyph: "♄", label: "Desafíos" },
  "tu-ascendente": { glyph: "AC", label: "Ascendente" },
  "como-actuas": { glyph: "♂", label: "Acción" },
  "donde-creces": { glyph: "♃", label: "Crecimiento" },
  "donde-rompes-esquemas": { glyph: "♅", label: "Cambio" },
  "donde-suenas": { glyph: "♆", label: "Sueños" },
  "donde-transformas": { glyph: "♇", label: "Transformación" },
};

function ReadingPanelSkeleton() {
  return (
    <article className="mt-4 min-h-[160px] animate-pulse border border-black/10 bg-white p-6">
      <div className="h-3 w-24 rounded bg-black/8" />
      <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-black/6" />
        <div className="h-3 w-5/6 rounded bg-black/6" />
        <div className="h-3 w-4/6 rounded bg-black/6" />
      </div>
    </article>
  );
}

function LockedReadingPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <article className="mt-4 min-h-[160px] border border-dusty-gold/30 bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
        {dictionary.chart.lockedEyebrow}
      </p>
      <h3 className="mt-2 font-serif text-[24px] leading-snug text-ivory">
        {dictionary.chart.lockedTitle}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#3a3048]">
        {dictionary.chart.lockedBody}
      </p>
      <Link
        href="/precios"
        className="mt-5 inline-flex border border-dusty-gold/45 bg-dusty-gold/[0.07] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24] transition hover:border-dusty-gold/70 hover:bg-dusty-gold/[0.12]"
      >
        {dictionary.chart.seePlans}
      </Link>
    </article>
  );
}

export function ChartGeneralReading({ chart, dictionary }: ChartGeneralReadingProps) {
  const locale = useStoredLocale();
  const [chartHash, setChartHash] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [selectedTheme, setSelectedTheme] = useState<GeneralReadingTheme>(GENERAL_READING_THEMES[0]);
  const controllersRef = useRef<Record<string, AbortController>>({});
  const cards = useMemo(() => getGeneralReadingCards(chart, dictionary), [chart, dictionary]);
  const cardByTheme = useMemo(() => new Map(cards.map((card) => [card.theme, card])), [cards]);

  const fetchReading = useCallback(
    async (theme: GeneralReadingTheme, currentHash: string) => {
      if (controllersRef.current[theme]) {
        return;
      }

      const controller = new AbortController();
      controllersRef.current[theme] = controller;

      setLoading((current) => ({ ...current, [theme]: true }));
      setErrors((current) => ({ ...current, [theme]: null }));
      setReadings((current) => ({ ...current, [theme]: current[theme] ?? "" }));

      try {
        const response = await fetch("/api/general-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chart, theme, locale }),
          signal: controller.signal,
        });

        if (response.status === 403) {
          throw new Error(PLAN_REQUIRED_ERROR);
        }

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          const suffix = detail ? ` (${response.status}: ${detail})` : ` (${response.status})`;
          throw new Error(`${dictionary.chart.generateError}${suffix}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          content += decoder.decode(value, { stream: true });
          setReadings((current) => ({ ...current, [theme]: content }));
        }

        const finalContent = normalizeReadingText(content);
        if (!finalContent) {
          throw new Error(dictionary.chart.generateError);
        }

        setCachedReading(currentHash, locale, theme, finalContent);
        setReadings((current) => ({ ...current, [theme]: finalContent }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setErrors((current) => ({ ...current, [theme]: (error as Error).message || dictionary.chart.generateError }));
        }
      } finally {
        delete controllersRef.current[theme];
        setLoading((current) => ({ ...current, [theme]: false }));
      }
    },
    [chart, dictionary.chart.generateError, locale],
  );

  useEffect(() => {
    let cancelled = false;

    Object.values(controllersRef.current).forEach((controller) => controller.abort());
    controllersRef.current = {};

    (async () => {
      const nextHash = await hashNatalChart(chart);
      if (cancelled) {
        return;
      }

      const cached = getAllCachedReadings(nextHash, locale);
      const missingThemes = GENERAL_READING_THEMES
        .filter((theme) => !cached[theme]);

      setChartHash(nextHash);
      setReadings(cached);
      setErrors({});
      setLoading(
        missingThemes.reduce<Record<string, boolean>>((nextLoading, theme) => {
          nextLoading[theme] = true;
          return nextLoading;
        }, {}),
      );

      await Promise.all(missingThemes.map((theme) => fetchReading(theme, nextHash)));
    })();

    return () => {
      cancelled = true;
      Object.values(controllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
    };
  }, [chart, fetchReading, locale]);

  const selectedCard = cardByTheme.get(selectedTheme) ?? cards[0];
  const selectedReading = readings[selectedTheme] ?? "";
  const selectedError = errors[selectedTheme];
  const selectedLoading = loading[selectedTheme] && !selectedReading;
  const selectedSplit = splitReading(selectedReading);

  return (
    <section className="pb-12 lg:pb-14">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {dictionary.result.generalReading.eyebrow}
        </p>
        <h2 className="mt-1.5 font-serif text-[30px] font-normal leading-tight text-ivory lg:text-[36px]">
          {dictionary.result.generalReading.title}
        </h2>
      </div>

      <div className="mx-auto mt-10 max-w-[760px]">
        <div className="grid grid-cols-5 gap-3 md:grid-cols-7">
          {GENERAL_READING_THEMES.map((theme) => {
            const meta = THEME_META[theme];
            const active = selectedTheme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className="flex min-w-0 flex-col items-center gap-1 p-2"
                aria-pressed={active}
              >
                <span
                  className={[
                    "flex h-12 w-12 items-center justify-center rounded-full font-serif text-xl transition",
                    active
                      ? "border border-dusty-gold/60 bg-dusty-gold/[0.07] text-[#5c4a24]"
                      : "border border-black/10 bg-white text-[#3a3048] hover:bg-black/[0.02]",
                  ].join(" ")}
                >
                  {meta.glyph}
                </span>
                <span className="max-w-12 truncate text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3a3048]">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedError === PLAN_REQUIRED_ERROR ? (
          <LockedReadingPanel dictionary={dictionary} />
        ) : selectedLoading ? (
          <ReadingPanelSkeleton />
        ) : (
          <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              {(selectedCard?.title ?? THEME_META[selectedTheme].label).toUpperCase()}
            </p>
            {selectedError ? (
              <div className="mt-3">
                <p className="text-sm leading-7 text-[#3a3048]">{selectedError}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (chartHash) {
                      void fetchReading(selectedTheme, chartHash);
                    }
                  }}
                  className="mt-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24] underline underline-offset-4"
                >
                  {dictionary.chart.retry}
                </button>
              </div>
            ) : (
              <>
                <h3 className="mt-2 font-serif text-[24px] leading-snug text-ivory">
                  {renderEmphasis(selectedSplit.headline)}
                </h3>
                {selectedSplit.body ? (
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">{renderEmphasis(selectedSplit.body)}</p>
                ) : null}
              </>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
