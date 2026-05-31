"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { DateTime } from "luxon";

import { calculateCurrentTransitsAction } from "@/lib/actions";
import { fetchAiReadingWithPolling } from "@/lib/ai-reading-client";
import type { NatalChartData } from "@/lib/chart";
import { getInterpretiveHouse, getPointInterpretiveHouse, normalizeLongitude, type ChartPoint, type ChartPointId, type ChartReferencePointId, type HouseCusp } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import type { FormValues } from "@/lib/chart-session";
import { GENERAL_READING_THEMES, type GeneralReadingTheme } from "@/lib/general-reading";
import { getCachedReading, setCachedReading } from "@/lib/general-reading-cache";
import type { Locale } from "@/lib/i18n";
import { getCachedLunarReport, setCachedLunarReport } from "@/lib/lunar-report-cache";
import type { LunarReportActionSet, LunarReportCacheEntry, LunarReportMetadata, LunarReportStreamEvent, LunationType } from "@/lib/lunar-report";
import { getCachedPremiumReading, setCachedPremiumReading } from "@/lib/premium-reading-cache";
import type { ReadingGender } from "@/lib/reading-gender";
import { normalizeReadingText } from "@/lib/reading-text";
import type { ActiveTransit } from "@/lib/transits.server";

type ChartPreparationGateProps = {
  chart: NatalChartData;
  request: FormValues | null;
  locale: Locale;
  readingId?: string;
  plan: string;
  planLoading: boolean;
  children: ReactNode;
};

type ChartPreparationTaskId = "general" | "lunar" | "transit";

type TransitResult = Awaited<ReturnType<typeof calculateCurrentTransitsAction>>;
type CachedTransitResult = Extract<TransitResult, { ok: true }>;
type TransitData = {
  dominantTitle?: string;
  dominantBody?: string;
  planetLanguage?: string;
  houses?: Array<{ house: number; title: string; body: string }>;
  readingGeneratedAt?: string;
};

const PRELOAD_RETRIES = 1;
const REPORT_MONTH_FORMAT = "yyyy-LL";
const REPORT_TYPES: LunationType[] = ["nueva", "llena", "nueva-2", "llena-2"];
const SARITA_DATA_MARKER = "__SARITA_DATA__";

function hasPlanAccess(currentPlan: string, requiredPlan: "pro" | "avanzado") {
  if (requiredPlan === "pro") {
    return currentPlan === "pro" || currentPlan === "avanzado";
  }

  return currentPlan === "avanzado";
}

function aspectWeight(type: string) {
  const weights: Record<string, number> = {
    conjunction: 4,
    opposition: 3.6,
    square: 3.4,
    trine: 2.8,
    sextile: 2.3,
    quincunx: 1.7,
  };
  return weights[type] ?? 1.5;
}

function transitWeight(transit: ActiveTransit) {
  const planetWeight: Partial<Record<ChartPointId, number>> = {
    saturn: 3.4,
    jupiter: 3,
    uranus: 2.8,
    neptune: 2.7,
    pluto: 3.2,
    mars: 2.1,
    venus: 1.7,
    mercury: 1.4,
    sun: 1.5,
    moon: 1.2,
    northNode: 2.4,
    southNode: 2.4,
    chiron: 2.3,
    lilith: 1.8,
  };
  const tightness = transit.strength === "tight" ? 3 : transit.strength === "moderate" ? 2 : 1;
  const natalPatternBonus = Math.min(1.5, transit.activatedNatalAspects.length * 0.35);
  const lifecycleBonus = transit.lifecycleEvent ? 2 : 0;
  return (planetWeight[transit.transitingPlanet] ?? 1) + aspectWeight(transit.aspectType) + tightness + natalPatternBonus + lifecycleBonus - transit.orb;
}

function topTransits(transits: ActiveTransit[]) {
  return [...transits].sort((a, b) => transitWeight(b) - transitWeight(a)).slice(0, 6);
}

function isChartPointId(id: ChartReferencePointId): id is ChartPointId {
  return id !== "ascendant" && id !== "descendant" && id !== "mc" && id !== "ic";
}

function findPoint(chart: NatalChartData, id: ChartReferencePointId) {
  if (!isChartPointId(id)) return null;
  return chart.points.find((point) => point.id === id) ?? chart.extendedPoints?.find((point) => point.id === id);
}

function referenceHouse(chart: NatalChartData, id: ChartReferencePointId) {
  if (id === "ascendant") return getHouseForLongitude(chart.meta.ascendant, chart.houses);
  if (id === "descendant") return getHouseForLongitude(chart.meta.descendant, chart.houses);
  if (id === "mc") return getHouseForLongitude(chart.meta.mc, chart.houses);
  if (id === "ic") return getHouseForLongitude(chart.meta.ic, chart.houses);
  const point = findPoint(chart, id);
  return point ? getPointInterpretiveHouse(point, chart.houses) : undefined;
}

function getHouseForLongitude(longitude: number, houses: HouseCusp[]) {
  const normalized = normalizeLongitude(longitude);
  const ordered = [...houses].sort((a, b) => a.longitude - b.longitude);

  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index]!;
    const next = ordered[(index + 1) % ordered.length]!;
    const start = current.longitude;
    const end = next.longitude <= start ? next.longitude + 360 : next.longitude;
    const value = normalized < start ? normalized + 360 : normalized;

    if (value >= start && value < end) {
      return current.house;
    }
  }

  return houses[0]?.house ?? 1;
}

function cleanJsonPayload(rawPayload: string) {
  const withoutFence = rawPayload
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  return start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : withoutFence;
}

function reportKeyFor(year: number, month: number, type: LunationType, locale: string, gender?: ReadingGender) {
  return `${locale}-${gender || "unspecified"}-${DateTime.utc(year, month, 1).toFormat(REPORT_MONTH_FORMAT)}-${type}`;
}

function lunationTime(metadata: LunarReportMetadata, timezone: string) {
  return DateTime.fromISO(metadata.timestamp, { zone: "utc" }).setZone(timezone).toMillis();
}

function getClosestType(previews: Partial<Record<LunationType, LunarReportMetadata>>, timezone: string) {
  const now = DateTime.now().setZone(timezone).toMillis();
  const candidates = REPORT_TYPES.filter((type) => previews[type]).sort((left, right) => (
    Math.abs(lunationTime(previews[left]!, timezone) - now) - Math.abs(lunationTime(previews[right]!, timezone) - now)
  ));

  return candidates[0] ?? "nueva";
}

async function withRetry(task: () => Promise<void>) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= PRELOAD_RETRIES; attempt += 1) {
    try {
      await task();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function preloadGeneralReadings({
  chart,
  chartHash,
  locale,
  readingId,
  gender,
}: {
  chart: NatalChartData;
  chartHash: string;
  locale: Locale;
  readingId?: string;
  gender?: ReadingGender;
}) {
  const cacheHash = readingId ? `reading:${readingId}:${chartHash}` : chartHash;
  const missingThemes = GENERAL_READING_THEMES.filter((theme) => !getCachedReading(cacheHash, locale, theme, gender));

  await Promise.all(missingThemes.map(async (theme: GeneralReadingTheme) => {
    const response = await fetchAiReadingWithPolling("/api/general-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, theme, locale, readingId, gender }),
    });

    if (!response.ok) {
      throw new Error(`General reading failed for ${theme}: ${response.status}`);
    }

    const content = normalizeReadingText(await response.text());
    if (!content) {
      throw new Error(`General reading returned empty content for ${theme}`);
    }

    setCachedReading(cacheHash, locale, theme, content, gender);
  }));
}

async function fetchLunarPreview(chart: NatalChartData, year: number, month: number, lunationType: LunationType, locale: Locale) {
  const response = await fetch("/api/lunar-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chart, year, month, lunationType, metadataOnly: true, locale }),
  });

  if (!response.ok) {
    throw new Error(`Lunar preview failed: ${response.status}`);
  }

  return (await response.json()) as LunarReportMetadata;
}

async function preloadLunarReport({
  chart,
  chartHash,
  locale,
  readingId,
  gender,
}: {
  chart: NatalChartData;
  chartHash: string;
  locale: Locale;
  readingId?: string;
  gender?: ReadingGender;
}) {
  const timezone = chart.event.timezoneIdentifier || "UTC";
  const currentMonth = DateTime.now().setZone(timezone);
  const year = currentMonth.year;
  const month = currentMonth.month;
  const previews: Partial<Record<LunationType, LunarReportMetadata>> = {};

  await Promise.all(REPORT_TYPES.map(async (type) => {
    try {
      previews[type] = await fetchLunarPreview(chart, year, month, type, locale);
    } catch {
      // Some months do not have a second lunation of each type.
    }
  }));

  const selectedType = getClosestType(previews, timezone);
  const metadata = previews[selectedType] ?? await fetchLunarPreview(chart, year, month, selectedType, locale);
  await preloadLunarReportForType({
    chart,
    chartHash,
    locale,
    readingId,
    gender,
    year,
    month,
    type: selectedType,
    metadata,
  });
}

async function preloadLunarReportForType({
  chart,
  chartHash,
  locale,
  readingId,
  gender,
  year,
  month,
  type,
  metadata,
}: {
  chart: NatalChartData;
  chartHash: string;
  locale: Locale;
  readingId?: string;
  gender?: ReadingGender;
  year: number;
  month: number;
  type: LunationType;
  metadata: LunarReportMetadata;
}) {
  const cacheHash = readingId ? `reading:${readingId}:${chartHash}` : chartHash;
  const cacheKey = reportKeyFor(year, month, type, locale, gender);
  if (getCachedLunarReport(cacheHash, cacheKey)) {
    return;
  }

  const response = await fetchAiReadingWithPolling("/api/lunar-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chart, year, month, lunationType: type, locale, readingId, cacheKey, gender }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Lunar report failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let prose = "";
  let actions: LunarReportActionSet | null = null;
  let reportMetadata = metadata;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as LunarReportStreamEvent;
      if (event.type === "metadata") reportMetadata = event.data;
      if (event.type === "text") prose += event.data;
      if (event.type === "actions") actions = event.data;
    }
  }

  const entry: LunarReportCacheEntry = {
    metadata: reportMetadata,
    prose: normalizeReadingText(prose),
    actions,
  };

  if (!entry.prose) {
    throw new Error("Lunar report returned empty prose.");
  }

  setCachedLunarReport(cacheHash, cacheKey, entry);
}

async function preloadRemainingLunarReports({
  chart,
  chartHash,
  locale,
  readingId,
  gender,
}: {
  chart: NatalChartData;
  chartHash: string;
  locale: Locale;
  readingId?: string;
  gender?: ReadingGender;
}) {
  const timezone = chart.event.timezoneIdentifier || "UTC";
  const currentMonth = DateTime.now().setZone(timezone);
  const year = currentMonth.year;
  const month = currentMonth.month;
  const previews: Partial<Record<LunationType, LunarReportMetadata>> = {};

  await Promise.all(REPORT_TYPES.map(async (type) => {
    try {
      previews[type] = await fetchLunarPreview(chart, year, month, type, locale);
    } catch {
      // Some months do not have a second lunation of each type.
    }
  }));

  const selectedType = getClosestType(previews, timezone);
  const remainingTypes = REPORT_TYPES
    .filter((type) => type !== selectedType && previews[type])
    .sort((left, right) => lunationTime(previews[left]!, timezone) - lunationTime(previews[right]!, timezone));

  for (const type of remainingTypes) {
    try {
      await preloadLunarReportForType({
        chart,
        chartHash,
        locale,
        readingId,
        gender,
        year,
        month,
        type,
        metadata: previews[type]!,
      });
    } catch (error) {
      console.error(`Background lunar preload failed: ${type}`, error);
      if (error instanceof Error && error.message.includes("429")) {
        break;
      }
    }
  }
}

export async function preloadRemainingLunarReadings({
  chart,
  locale,
  readingId,
  gender,
}: {
  chart: NatalChartData;
  locale: Locale;
  readingId?: string;
  gender?: ReadingGender;
}) {
  const chartHash = await hashNatalChart(chart);
  await preloadRemainingLunarReports({ chart, chartHash, locale, readingId, gender });
}

async function preloadTransitReading({
  chart,
  request,
  chartHash,
  locale,
  readingId,
}: {
  chart: NatalChartData;
  request: FormValues | null;
  chartHash: string;
  locale: Locale;
  readingId?: string;
}) {
  const currentLocation = request?.selectedLocation ?? null;
  const currentLocationKey = currentLocation
    ? `${currentLocation.id}:${currentLocation.lat}:${currentLocation.lng}:${currentLocation.timezone}`
    : "birth-location";
  const resultCacheKey = `transit-result:${new Date().toISOString().slice(0, 10)}:${currentLocationKey}`;
  const cachedResult = getCachedPremiumReading<CachedTransitResult>(chartHash, resultCacheKey);
  const result = cachedResult ?? await calculateCurrentTransitsAction(chart, request, currentLocation);

  if (!result.ok) {
    throw new Error("Transit calculation failed.");
  }

  if (!cachedResult) {
    setCachedPremiumReading(chartHash, resultCacheKey, result);
  }

  if (result.transits.length === 0) {
    return;
  }

  const aiCacheHash = readingId ? `reading:${readingId}:${chartHash}` : chartHash;
  const cacheKey = `transits:v4:${locale}:${request?.gender || "unspecified"}:${currentLocationKey}`;
  if (getCachedPremiumReading<TransitData>(aiCacheHash, cacheKey)) {
    return;
  }

  const top = topTransits(result.transits).map((transit) => ({
    transitingPlanet: transit.transitingPlanet,
    natalPlanet: transit.natalPlanet,
    aspectType: transit.aspectType,
    lifecycleEvent: transit.lifecycleEvent,
    orb: transit.orb,
    strength: transit.strength,
    natalHouse: (() => {
      return referenceHouse(chart, transit.natalPlanet);
    })(),
    transitingHouse: (() => {
      const transitingPoint = findPoint(result.chart, transit.transitingPlanet) as ChartPoint | undefined;
      if (!transitingPoint) return undefined;
      const technicalHouse = getHouseForLongitude(transitingPoint.longitude, chart.houses);
      return getInterpretiveHouse({ longitude: transitingPoint.longitude, house: technicalHouse, houses: chart.houses });
    })(),
    activatedNatalAspects: transit.activatedNatalAspects,
  }));

  const response = await fetchAiReadingWithPolling("/api/transit-reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chart, transits: top, locale, readingId, cacheKey, gender: request?.gender || undefined }),
  });

  if (!response.ok) {
    throw new Error(`Transit reading failed: ${response.status}`);
  }

  const accumulated = await response.text();
  const markerIdx = accumulated.indexOf(SARITA_DATA_MARKER);
  if (markerIdx === -1) {
    throw new Error("Transit reading response missing SARITA data marker.");
  }

  const parsed = JSON.parse(cleanJsonPayload(accumulated.slice(markerIdx + SARITA_DATA_MARKER.length).trim())) as TransitData;
  setCachedPremiumReading(aiCacheHash, cacheKey, {
    ...parsed,
    readingGeneratedAt: result.generatedAt,
  });
}

function preparationLabel(locale: Locale, step: string) {
  const labels: Record<string, Record<Locale, string>> = {
    general: {
      es: "Leyendo tu carta...",
      en: "Reading your chart...",
      it: "Sto leggendo la tua carta...",
    },
    lunar: {
      es: "Preparando la luna del mes...",
      en: "Preparing this month's moon...",
      it: "Preparo la luna del mese...",
    },
    transit: {
      es: "Calculando tus transitos...",
      en: "Calculating your transits...",
      it: "Calcolo i tuoi transiti...",
    },
    complete: {
      es: "Abriendo tu observatorio...",
      en: "Opening your observatory...",
      it: "Apro il tuo osservatorio...",
    },
  };

  return labels[step]?.[locale] ?? labels[step]?.es ?? labels.complete.es;
}

function chartPreparationTasks(plan: string) {
  return [
    ...(plan !== "free" ? [{ id: "general" as const }] : []),
    ...(hasPlanAccess(plan, "pro") ? [{ id: "lunar" as const }] : []),
    ...(hasPlanAccess(plan, "avanzado") ? [{ id: "transit" as const }] : []),
  ];
}

export async function prepareChartReadings({
  chart,
  request,
  locale,
  readingId,
  plan,
  onStep,
  onProgress,
}: {
  chart: NatalChartData;
  request: FormValues | null;
  locale: Locale;
  readingId?: string;
  plan: string;
  onStep?: (label: string, task: ChartPreparationTaskId) => void;
  onProgress?: (completed: number, total: number) => void;
}) {
  const chartHash = await hashNatalChart(chart);
  const gender = request?.gender || undefined;
  const tasks = chartPreparationTasks(plan);
  let completed = 0;

  onProgress?.(completed, tasks.length);

  for (const task of tasks) {
    onStep?.(preparationLabel(locale, task.id), task.id);

    try {
      if (task.id === "general") {
        await withRetry(() => preloadGeneralReadings({ chart, chartHash, locale, readingId, gender }));
      } else if (task.id === "lunar") {
        await withRetry(() => preloadLunarReport({ chart, chartHash, locale, readingId, gender }));
      } else {
        await withRetry(() => preloadTransitReading({ chart, request, chartHash, locale, readingId }));
      }
    } catch (error) {
      console.error(`Chart preparation task failed: ${task.id}`, error);
    } finally {
      completed += 1;
      onProgress?.(completed, tasks.length);
    }
  }
}

function PreparationScreen({ locale, step, completed, total }: { locale: Locale; step: string; completed: number; total: number }) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 100;

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_24%,rgba(0,102,255,0.28),transparent_24rem),linear-gradient(180deg,#030814_0%,#061331_56%,#071437_100%)] px-6 text-center text-[#e8f3ff]">
      <div aria-hidden="true" className="sarita-bright-starfield pointer-events-none absolute inset-0">
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 flex max-w-sm flex-col items-center">
        <div className="relative h-36 w-36 rounded-full border border-[#f5d782]/32 bg-[#061331]/54 shadow-[0_0_50px_rgba(0,102,255,0.32),inset_0_0_34px_rgba(245,215,130,0.08)]">
          <div
            className="absolute inset-3 rounded-full bg-[conic-gradient(from_180deg,#f5d782_var(--progress),rgba(215,231,255,0.12)_0)] p-[1px]"
            style={{ "--progress": `${progress}%` } as CSSProperties}
          >
            <div className="h-full w-full rounded-full bg-[#061331]" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5d782] shadow-[0_0_40px_rgba(245,215,130,0.7)]" />
        </div>
        <p className="mt-8 font-serif text-[15px] italic lowercase tracking-[0.16em] text-[#f5d782]">
          SARITA
        </p>
        <h1 className="mt-3 font-serif text-[30px] font-normal leading-tight text-[#fffaf0]">
          {preparationLabel(locale, step)}
        </h1>
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#d7e7ff]/68">
          {completed}/{total}
        </p>
      </div>
    </div>
  );
}

export function ChartPreparationGate({
  chart,
  request,
  locale,
  readingId,
  plan,
  planLoading,
  children,
}: ChartPreparationGateProps) {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [step, setStep] = useState("general");
  const gender = request?.gender || undefined;

  const tasks = useMemo(() => {
    if (planLoading) return [];

    return chartPreparationTasks(plan);
  }, [plan, planLoading]);

  useEffect(() => {
    if (planLoading) return;

    let active = true;
    setReady(false);
    setCompleted(0);

    void (async () => {
      const chartHash = await hashNatalChart(chart);
      if (!active) return;

      for (const task of tasks) {
        if (!active) return;
        setStep(task.id);
        try {
          if (task.id === "general") {
            await withRetry(() => preloadGeneralReadings({ chart, chartHash, locale, readingId, gender }));
          } else if (task.id === "lunar") {
            await withRetry(() => preloadLunarReport({ chart, chartHash, locale, readingId, gender }));
          } else if (task.id === "transit") {
            await withRetry(() => preloadTransitReading({ chart, request, chartHash, locale, readingId }));
          }
        } catch (error) {
          console.error(`Chart preparation task failed: ${task.id}`, error);
        } finally {
          if (active) setCompleted((current) => current + 1);
        }
      }

      if (active) {
        setStep("complete");
        setReady(true);
        if (hasPlanAccess(plan, "pro")) {
          void preloadRemainingLunarReports({ chart, chartHash, locale, readingId, gender });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [chart, gender, locale, plan, planLoading, readingId, request, tasks]);

  if (planLoading || !ready) {
    return <PreparationScreen locale={locale} step={step} completed={completed} total={Math.max(tasks.length, 1)} />;
  }

  return <>{children}</>;
}
