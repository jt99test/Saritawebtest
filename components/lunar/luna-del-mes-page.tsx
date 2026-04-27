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
import { LunationToggle } from "@/components/lunar/lunation-toggle";
import { LunationHeaderCard } from "@/components/lunar/lunation-header-card";
import { LunationReadingCard } from "@/components/lunar/lunation-reading-card";
import { ActiveTransitsList } from "@/components/lunar/active-transits-list";
import { MonthlyRoutineCard } from "@/components/lunar/monthly-routine-card";
import { PracticalActions } from "@/components/lunar/practical-actions";

type LunaDelMesPageProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
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

function reportKeyFor(year: number, month: number, type: LunationType) {
  return `${DateTime.utc(year, month, 1).toFormat(REPORT_MONTH_FORMAT)}-${type}`;
}

function formatToggleDate(timestamp: string, timezone: string) {
  return DateTime.fromISO(timestamp, { zone: "utc" })
    .setZone(timezone)
    .setLocale("es")
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
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo calcular la luna del mes.");
  }

  return (await response.json()) as LunarReportMetadata;
}

export function LunaDelMesPage({ chart, dictionary }: LunaDelMesPageProps) {
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
          fetchPreview(chart, year, month, "nueva"),
          fetchPreview(chart, year, month, "llena"),
        ]);

        if (cancelled) {
          return;
        }

        const nextPreviews = { nueva, llena };
        setPreviews(nextPreviews);
        setSelectedType(getClosestType(nextPreviews, timezone));
      } catch (error) {
        if (!cancelled) {
          setPreviewError((error as Error).message);
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
  }, [chart, month, timezone, year]);

  const selectedMetadata = previews[selectedType] ?? null;
  const selectedReportKey = reportKeyFor(year, month, selectedType);
  const cachedEntry = chartHash ? cachedReports[selectedReportKey] ?? null : null;
  const activeStream = streamState[selectedType];
  const prose = activeStream.prose || cachedEntry?.prose || "";
  const actions = activeStream.actions ?? cachedEntry?.actions ?? null;

  async function generateReport(type: LunationType) {
    if (!chartHash) {
      return;
    }

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
      }),
    }).catch(() => null);

    if (!response?.ok || !response.body) {
      setStreamState((current) => ({
        ...current,
        [type]: {
          prose: "",
          actions: null,
          loading: false,
          error: "No se pudo generar. Inténtalo de nuevo.",
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
          error: "No se pudo generar. Inténtalo de nuevo.",
        },
      }));
      return;
    }

    const nextEntry = {
      metadata,
      prose: proseAccumulator.trim(),
      actions: actionsPayload,
    };

    setCachedLunarReport(chartHash, reportKeyFor(year, month, type), nextEntry);
    setCachedReports((current) => ({
      ...current,
      [reportKeyFor(year, month, type)]: nextEntry,
    }));
    setStreamState((current) => ({
      ...current,
      [type]: {
        prose: proseAccumulator.trim(),
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
        label: type === "nueva" ? "Luna Nueva" : "Luna Llena",
        date: formatToggleDate(metadata.timestamp, timezone),
      },
    ];
  });

  return (
    <div className="mx-auto max-w-[1200px] pb-0 pt-20">
      <header className="text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          luna del mes
        </p>
        <h1 className="mt-2 font-serif text-[56px] font-normal leading-none tracking-[-0.01em] text-white lg:text-[80px]">
          {currentMonth.setLocale("es").toFormat("LLLL yyyy").toLowerCase()}
        </h1>
        <p className="mx-auto mt-4 max-w-[480px] font-serif text-[15px] italic leading-7 text-white/50 lg:max-w-[540px]">
          Dos lunas marcan este mes. Tócalas para entrar.
        </p>

        <div className="mt-24 lg:mt-[120px]">
          {toggleOptions.length > 0 ? (
            <LunationToggle
              options={toggleOptions}
              value={selectedType}
              onChange={setSelectedType}
            />
          ) : null}
        </div>
      </header>

      {previewLoading ? (
        <p className="mt-20 text-center font-serif text-sm italic leading-7 text-white/55">
          Calculando tu luna del mes...
        </p>
      ) : previewError ? (
        <p className="mt-20 text-center font-serif text-sm italic leading-7 text-white/55">
          {previewError}
        </p>
      ) : selectedMetadata ? (
        <div>
          <div className="mt-20 lg:mt-[120px]">
            <LunationHeaderCard
              metadata={selectedMetadata}
              dictionary={dictionary}
              timezone={timezone}
            />
          </div>

          <div className="mt-32 lg:mt-40">
            <LunationReadingCard
              prose={prose}
              loading={activeStream.loading}
              error={activeStream.error}
              onGenerate={() => void generateReport(selectedType)}
            />
          </div>

          <div className="mt-24 lg:mt-40">
            <ActiveTransitsList
              transits={selectedMetadata.activeTransits}
              timezone={timezone}
            />
          </div>

          <div className="mt-24 lg:mt-40">
            <MonthlyRoutineCard metadata={selectedMetadata} />
          </div>

          <div className="mt-32 lg:mt-40">
            <PracticalActions actions={actions} loading={activeStream.loading} />
          </div>
        </div>
      ) : (
        <p className="mt-20 text-center font-serif text-sm italic leading-7 text-white/55">
          No hemos encontrado lunaciones para este mes.
        </p>
      )}
    </div>
  );
}
