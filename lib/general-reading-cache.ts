import type { GeneralReadingTheme } from "@/lib/general-reading";
import type { Locale } from "@/lib/i18n";
import type { ReadingGender } from "@/lib/reading-gender";

const STORAGE_KEY = "sarita_general_readings-v3";
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

function readingKey(locale: Locale, theme: GeneralReadingTheme, gender?: ReadingGender) {
  return `${locale}:${gender || "unspecified"}:${theme}`;
}

export function getCachedReading(chartHash: string, locale: Locale, theme: GeneralReadingTheme, gender?: ReadingGender): string | null {
  const store = readStore();
  const chartReadings = store[chartHash];
  const key = readingKey(locale, theme, gender);

  if (!chartReadings?.[key]) {
    return null;
  }

  writeStore(touchChartHash(store, chartHash));
  return chartReadings[key];
}

export function setCachedReading(chartHash: string, locale: Locale, theme: GeneralReadingTheme, content: string, gender?: ReadingGender): void {
  const store = readStore();
  const nextStore: ReadingCacheStore = {
    ...store,
    [chartHash]: {
      ...(store[chartHash] ?? {}),
      [readingKey(locale, theme, gender)]: content,
    },
  };

  writeStore(touchChartHash(nextStore, chartHash));
}

export function getAllCachedReadings(chartHash: string, locale: Locale, gender?: ReadingGender): Record<string, string> {
  const store = readStore();
  const chartReadings = store[chartHash] ?? {};
  const prefix = `${locale}:${gender || "unspecified"}:`;
  const localizedReadings = Object.fromEntries(
    Object.entries(chartReadings)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );

  if (store[chartHash]) {
    writeStore(touchChartHash(store, chartHash));
  }

  return localizedReadings;
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
