import type { LunarReportCacheEntry } from "@/lib/lunar-report";

const STORAGE_KEY = "sarita_lunar_reports";
const MAX_MONTHS_PER_CHART = 3;

type LunarReportStore = Record<string, Record<string, LunarReportCacheEntry>>;

function readStore(): LunarReportStore {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as LunarReportStore;
  } catch {
    return {};
  }
}

function writeStore(store: LunarReportStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function touchReportKey(
  reports: Record<string, LunarReportCacheEntry>,
  reportKey: string,
) {
  const nextReports: Record<string, LunarReportCacheEntry> = {};
  const currentEntry = reports[reportKey];

  for (const [key, value] of Object.entries(reports)) {
    if (key !== reportKey) {
      nextReports[key] = value;
    }
  }

  if (currentEntry) {
    nextReports[reportKey] = currentEntry;
  }

  while (Object.keys(nextReports).length > MAX_MONTHS_PER_CHART) {
    const oldest = Object.keys(nextReports)[0];
    if (!oldest) {
      break;
    }

    delete nextReports[oldest];
  }

  return nextReports;
}

export function getCachedLunarReport(
  chartHash: string,
  reportKey: string,
): LunarReportCacheEntry | null {
  const store = readStore();
  const chartReports = store[chartHash];

  if (!chartReports?.[reportKey]) {
    return null;
  }

  writeStore({
    ...store,
    [chartHash]: touchReportKey(chartReports, reportKey),
  });

  return chartReports[reportKey];
}

export function setCachedLunarReport(
  chartHash: string,
  reportKey: string,
  entry: LunarReportCacheEntry,
): void {
  const store = readStore();
  const nextReports = touchReportKey(
    {
      ...(store[chartHash] ?? {}),
      [reportKey]: entry,
    },
    reportKey,
  );

  writeStore({
    ...store,
    [chartHash]: nextReports,
  });
}

export function getAllCachedLunarReports(
  chartHash: string,
): Record<string, LunarReportCacheEntry> {
  const store = readStore();
  return store[chartHash] ?? {};
}

export function clearLunarReportCacheForChart(chartHash: string): void {
  const store = readStore();
  if (!store[chartHash]) {
    return;
  }

  const nextStore = { ...store };
  delete nextStore[chartHash];
  writeStore(nextStore);
}
