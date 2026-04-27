import type { GeneralReadingTheme } from "@/lib/general-reading";

const STORAGE_KEY = "sarita_general_readings";
const MAX_CHARTS = 5;

type ReadingCacheStore = Record<string, Record<string, string>>;

function readStore(): ReadingCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ReadingCacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: ReadingCacheStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function touchChartHash(store: ReadingCacheStore, chartHash: string) {
  const nextStore: ReadingCacheStore = {};
  const currentEntry = store[chartHash];

  for (const [key, value] of Object.entries(store)) {
    if (key !== chartHash) {
      nextStore[key] = value;
    }
  }

  if (currentEntry) {
    nextStore[chartHash] = currentEntry;
  }

  while (Object.keys(nextStore).length > MAX_CHARTS) {
    const oldest = Object.keys(nextStore)[0];
    if (!oldest) {
      break;
    }

    delete nextStore[oldest];
  }

  return nextStore;
}

export function getCachedReading(chartHash: string, theme: GeneralReadingTheme): string | null {
  const store = readStore();
  const chartReadings = store[chartHash];

  if (!chartReadings?.[theme]) {
    return null;
  }

  writeStore(touchChartHash(store, chartHash));
  return chartReadings[theme];
}

export function setCachedReading(chartHash: string, theme: GeneralReadingTheme, content: string): void {
  const store = readStore();
  const nextStore: ReadingCacheStore = {
    ...store,
    [chartHash]: {
      ...(store[chartHash] ?? {}),
      [theme]: content,
    },
  };

  writeStore(touchChartHash(nextStore, chartHash));
}

export function getAllCachedReadings(chartHash: string): Record<string, string> {
  const store = readStore();
  const chartReadings = store[chartHash] ?? {};

  if (store[chartHash]) {
    writeStore(touchChartHash(store, chartHash));
  }

  return chartReadings;
}

export function clearCacheForChart(chartHash: string): void {
  const store = readStore();
  if (!store[chartHash]) {
    return;
  }

  const nextStore = { ...store };
  delete nextStore[chartHash];
  writeStore(nextStore);
}
