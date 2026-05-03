"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import type { NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import type {
  LunarReportActionSet,
  LunarReportCacheEntry,
  LunarReportMetadata,
  LunarReportStreamEvent,
  LunationType,
} from "@/lib/lunar-report";
import { hashNatalChart } from "@/lib/chart-hash";
import {
  getAllCachedLunarReports,
  setCachedLunarReport,
} from "@/lib/lunar-report-cache";
import { normalizeReadingText } from "@/lib/reading-text";
import type { ReadingGender } from "@/lib/reading-gender";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { LunationToggle } from "@/components/lunar/lunation-toggle";
import { LunationHeaderCard } from "@/components/lunar/lunation-header-card";
import { LunationReadingCard } from "@/components/lunar/lunation-reading-card";
import { ActiveTransitsList } from "@/components/lunar/active-transits-list";
import { MonthlyRoutineCard } from "@/components/lunar/monthly-routine-card";
import { PracticalActions } from "@/components/lunar/practical-actions";

type LunaDelMesPageProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  readingId?: string;
  gender?: ReadingGender;
};

type StreamState = {
  prose: string;
  actions: LunarReportActionSet | null;
  loading: boolean;
  error: string | null;
};

type PreviewMap = Partial<Record<LunationType, LunarReportMetadata>>;

const REPORT_MONTH_FORMAT = "yyyy-LL";
const REPORT_TYPES: LunationType[] = ["nueva", "llena"];

function monthDateForChart(chart: NatalChartData) {
  const zone = chart.event.timezoneIdentifier || "UTC";
  return DateTime.now().setZone(zone);
}

function reportKeyFor(year: number, month: number, type: LunationType, locale: string, gender?: ReadingGender) {
  return `${locale}-${gender || "unspecified"}-${DateTime.utc(year, month, 1).toFormat(REPORT_MONTH_FORMAT)}-${type}`;
}

function formatToggleDate(timestamp: string, timezone: string, locale: string) {
  return DateTime.fromISO(timestamp, { zone: "utc" })
    .setZone(timezone)
    .setLocale(locale)
    .toFormat("d 'de' LLLL");
}

function getClosestType(previews: PreviewMap, timezone: string) {
  const now = DateTime.now().setZone(timezone).toMillis();
  const candidates = REPORT_TYPES.filter((type) => previews[type]).sort((left, right) => {
    const leftDistance = Math.abs(
      DateTime.fromISO(previews[left]!.timestamp, { zone: "utc" }).setZone(timezone).toMillis() - now,
    );
    const rightDistance = Math.abs(
      DateTime.fromISO(previews[right]!.timestamp, { zone: "utc" }).setZone(timezone).toMillis() - now,
    );
    return leftDistance - rightDistance;
  });

  return candidates[0] ?? "nueva";
}

async function fetchPreview(
  chart: NatalChartData,
  year: number,
  month: number,
  lunationType: LunationType,
  locale: string,
) {
  const response = await fetch("/api/lunar-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chart,
      year,
      month,
      lunationType,
      metadataOnly: true,
      locale,
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo calcular la luna del mes.");
  }

  return (await response.json()) as LunarReportMetadata;
}

export function LunaDelMesPage({ chart, dictionary, readingId, gender }: LunaDelMesPageProps) {
  const locale = useStoredLocale();
  const currentMonth = useMemo(() => monthDateForChart(chart), [chart]);
  const year = currentMonth.year;
  const month = currentMonth.month;
  const timezone = chart.event.timezoneIdentifier || "UTC";

  const [chartHash, setChartHash] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewMap>({});
  const [selectedType, setSelectedType] = useState<LunationType>("nueva");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [cachedReports, setCachedReports] = useState<Record<string, LunarReportCacheEntry>>({});
  const [streamState, setStreamState] = useState<Record<LunationType, StreamState>>({
    nueva: { prose: "", actions: null, loading: false, error: null },
    llena: { prose: "", actions: null, loading: false, error: null },
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const nextHash = await hashNatalChart(chart);
      if (cancelled) {
        return;
      }

      setChartHash(nextHash);
      setCachedReports(getAllCachedLunarReports(nextHash));
      setPreviews({});
      setSelectedType("nueva");
      setPreviewError(null);
      setPreviewLoading(true);
      setStreamState({
        nueva: { prose: "", actions: null, loading: false, error: null },
        llena: { prose: "", actions: null, loading: false, error: null },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const [nueva, llena] = await Promise.all([
          fetchPreview(chart, year, month, "nueva", locale),
          fetchPreview(chart, year, month, "llena", locale),
        ]);

        if (cancelled) {
          return;
        }

        const nextPreviews = { nueva, llena };
        setPreviews(nextPreviews);
        setSelectedType(getClosestType(nextPreviews, timezone));
      } catch {
        if (!cancelled) {
          setPreviewError(dictionary.lunar.calculateError);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, locale, month, timezone, year]);

  const selectedMetadata = previews[selectedType] ?? null;
  const selectedReportKey = reportKeyFor(year, month, selectedType, locale, gender);
  const cachedEntry = chartHash ? cachedReports[selectedReportKey] ?? null : null;
  const activeStream = streamState[selectedType];
  const prose = normalizeReadingText(activeStream.prose || cachedEntry?.prose || "");
  const actions = activeStream.actions ?? cachedEntry?.actions ?? null;

  useEffect(() => {
    if (!chartHash || !selectedMetadata || prose || activeStream.loading || activeStream.error) {
      return;
    }

    void loadReport(selectedType);
  }, [activeStream.error, activeStream.loading, chartHash, prose, selectedMetadata, selectedType]);

  async function loadReport(type: LunationType) {
    if (!chartHash) {
      return;
    }

    const cacheKey = reportKeyFor(year, month, type, locale, gender);

    setStreamState((current) => ({
      ...current,
      [type]: { prose: "", actions: null, loading: true, error: null },
    }));

    const response = await fetch("/api/lunar-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart,
        year,
        month,
        lunationType: type,
        locale,
        readingId,
        cacheKey,
        gender,
      }),
    }).catch(() => null);

    if (!response?.ok || !response.body) {
      setStreamState((current) => ({
        ...current,
        [type]: {
          prose: "",
          actions: null,
          loading: false,
          error: dictionary.chart.generateError,
        },
      }));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let proseAccumulator = "";
    let actionsPayload: LunarReportActionSet | null = null;
    let metadata = previews[type] ?? null;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = JSON.parse(line) as LunarReportStreamEvent;

        if (event.type === "metadata") {
          metadata = event.data;
          setPreviews((current) => ({ ...current, [type]: event.data }));
        }

        if (event.type === "text") {
          proseAccumulator += event.data;
          setStreamState((current) => ({
            ...current,
            [type]: {
              prose: proseAccumulator,
              actions: actionsPayload,
              loading: true,
              error: null,
            },
          }));
        }

        if (event.type === "actions") {
          actionsPayload = event.data;
          setStreamState((current) => ({
            ...current,
            [type]: {
              prose: proseAccumulator,
              actions: actionsPayload,
              loading: true,
              error: null,
            },
          }));
        }
      }
    }

    if (!metadata || !proseAccumulator.trim()) {
      setStreamState((current) => ({
        ...current,
        [type]: {
          prose: "",
          actions: null,
          loading: false,
          error: dictionary.chart.generateError,
        },
      }));
      return;
    }

    const nextEntry = {
      metadata,
      prose: normalizeReadingText(proseAccumulator),
      actions: actionsPayload,
    };

    const nextReportKey = reportKeyFor(year, month, type, locale, gender);
    setCachedLunarReport(chartHash, nextReportKey, nextEntry);
    setCachedReports((current) => ({
      ...current,
      [nextReportKey]: nextEntry,
    }));
    setStreamState((current) => ({
      ...current,
      [type]: {
        prose: normalizeReadingText(proseAccumulator),
        actions: actionsPayload,
        loading: false,
        error: null,
      },
    }));
  }

  const toggleOptions = REPORT_TYPES.flatMap((type) => {
    const metadata = previews[type];
    if (!metadata) {
      return [];
    }

    return [
      {
        id: type,
        label: type === "nueva" ? dictionary.lunar.newMoon : dictionary.lunar.fullMoon,
        date: formatToggleDate(metadata.timestamp, timezone, locale),
      },
    ];
  });

  return (
    <div className="mx-auto max-w-[1080px] pb-0 pt-8 lg:pt-10">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-sm leading-7 text-[#3a3048]">
          {dictionary.lunar.intro}
        </p>
      </div>

      <header className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {dictionary.lunar.eyebrow}
        </p>
        <h1 className="mt-1.5 font-serif text-[52px] font-normal leading-none tracking-[-0.01em] text-ivory lg:text-[68px]">
          {currentMonth.setLocale(locale).toFormat("LLLL yyyy").toLowerCase()}
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] font-serif text-[15px] italic leading-7 text-[#3a3048] lg:max-w-[540px]">
          {dictionary.lunar.subtitle}
        </p>

        <div className="mt-10 lg:mt-12">
          {toggleOptions.length > 0 ? (
            <LunationToggle
              options={toggleOptions}
              value={selectedType}
              onChange={setSelectedType}
              dictionary={dictionary}
            />
          ) : null}
        </div>
      </header>

      {previewLoading ? (
        <p className="mt-12 text-center font-serif text-sm italic leading-7 text-[#3a3048]">
          {dictionary.lunar.calculating}
        </p>
      ) : previewError ? (
        <p className="mt-12 text-center font-serif text-sm italic leading-7 text-[#3a3048]">
          {previewError}
        </p>
      ) : selectedMetadata ? (
        <div>
          <div className="mt-12 lg:mt-14">
            <LunationHeaderCard
              metadata={selectedMetadata}
              dictionary={dictionary}
              timezone={timezone}
              locale={locale}
            />
          </div>

          <div className="mt-20 lg:mt-28">
            <LunationReadingCard
              prose={prose}
              loading={activeStream.loading}
              error={activeStream.error}
              onRetry={() => void loadReport(selectedType)}
              dictionary={dictionary}
            />
          </div>

          <div className="mt-10 lg:mt-12">
            <ActiveTransitsList
              transits={selectedMetadata.activeTransits}
              timezone={timezone}
              dictionary={dictionary}
            />
          </div>

          <div className="mt-10 lg:mt-12">
            <PracticalActions actions={actions} loading={activeStream.loading} />
          </div>

          <div className="mt-16 lg:mt-20">
            <MonthlyRoutineCard metadata={selectedMetadata} dictionary={dictionary} />
          </div>
        </div>
      ) : (
        <p className="mt-12 text-center font-serif text-sm italic leading-7 text-[#3a3048]">
          {dictionary.lunar.emptyMonth}
        </p>
      )}
    </div>
  );
}
