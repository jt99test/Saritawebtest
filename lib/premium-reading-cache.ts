const STORAGE_KEY = "sarita_premium_readings";
const MAX_CHARTS = 5;
const MAX_ENTRIES_PER_CHART = 16;

type PremiumReadingEntry = {
  value: unknown;
};

type PremiumReadingStore = Record<string, Record<string, PremiumReadingEntry>>;

function readStore(): PremiumReadingStore {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as PremiumReadingStore;
  } catch {
    return {};
  }
}

function writeStore(store: PremiumReadingStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function touchChartHash(store: PremiumReadingStore, chartHash: string) {
  const nextStore: PremiumReadingStore = {};
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
    if (!oldest) break;
    delete nextStore[oldest];
  }

  return nextStore;
}

function touchEntry(entries: Record<string, PremiumReadingEntry>, entryKey: string) {
  const nextEntries: Record<string, PremiumReadingEntry> = {};
  const currentEntry = entries[entryKey];

  for (const [key, value] of Object.entries(entries)) {
    if (key !== entryKey) {
      nextEntries[key] = value;
    }
  }

  if (currentEntry) {
    nextEntries[entryKey] = currentEntry;
  }

  while (Object.keys(nextEntries).length > MAX_ENTRIES_PER_CHART) {
    const oldest = Object.keys(nextEntries)[0];
    if (!oldest) break;
    delete nextEntries[oldest];
  }

  return nextEntries;
}

export function getCachedPremiumReading<T>(chartHash: string, entryKey: string): T | null {
  const store = readStore();
  const chartEntries = store[chartHash];
  const entry = chartEntries?.[entryKey];

  if (!entry) {
    return null;
  }

  writeStore({
    ...touchChartHash(store, chartHash),
    [chartHash]: touchEntry(chartEntries, entryKey),
  });

  return entry.value as T;
}

export function setCachedPremiumReading<T>(chartHash: string, entryKey: string, value: T): void {
  const store = readStore();
  const nextEntries = touchEntry(
    {
      ...(store[chartHash] ?? {}),
      [entryKey]: { value },
    },
    entryKey,
  );

  writeStore(touchChartHash({
    ...store,
    [chartHash]: nextEntries,
  }, chartHash));
}

export function clearCachedPremiumReading(chartHash: string, entryKey: string): void {
  const store = readStore();
  const chartEntries = store[chartHash];
  if (!chartEntries?.[entryKey]) return;

  const nextEntries = { ...chartEntries };
  delete nextEntries[entryKey];

  writeStore({
    ...store,
    [chartHash]: nextEntries,
  });
}
