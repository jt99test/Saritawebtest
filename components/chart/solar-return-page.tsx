"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { BiWheelInfoPanel } from "@/components/chart/bi-wheel-info-panel";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { calculateSolarReturnAction } from "@/lib/actions";
import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { getCachedPremiumReading, setCachedPremiumReading } from "@/lib/premium-reading-cache";
import { normalizeReadingText } from "@/lib/reading-text";

type SolarReturnPageProps = {
  natalChart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
  readingId?: string;
};

type SolarData = {
  cards?: Array<{ key: string; title: string; body: string }>;
  priorities?: Array<{ title: string; body: string }>;
};

type SolarWheelMode = "all" | "focus";

type CachedSolarReturnReading = {
  chart: NatalChartData;
  data: SolarData;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";
const READING_TIMEOUT_MS = 45000;
const SOLAR_RETURN_SELECTION_KEY = "sarita_solar_return_selection";

type StoredSolarReturnSelection = {
  targetYear: number;
  city: string;
  selectedLocation: PlaceSuggestion | null;
};

function currentSolarReturnYear(request: FormValues | null) {
  const now = new Date();
  const birthDate = request?.birthDate ? new Date(`${request.birthDate}T00:00:00`) : null;
  if (!birthDate) return now.getFullYear();

  const birthdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  return now >= birthdayThisYear ? now.getFullYear() : now.getFullYear() - 1;
}

function cardTabLabel(key: string, solarCopy: Dictionary["result"]["solarReturnPage"]) {
  if (key === "theme") return solarCopy.themeCard;
  if (key === "area") return solarCopy.areaCard;
  if (key === "tone") return solarCopy.toneCard;
  return key;
}

function cleanJsonPayload(rawPayload: string) {
  const withoutFence = rawPayload
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function normalizeSolarData(data: SolarData): SolarData {
  return {
    cards: data.cards?.map((card) => ({
      key: card.key,
      title: normalizeReadingText(card.title),
      body: normalizeReadingText(card.body),
    })),
    priorities: data.priorities?.map((priority) => ({
      title: normalizeReadingText(priority.title),
      body: normalizeReadingText(priority.body),
    })),
  };
}

function WheelModeToggle({
  mode,
  onChange,
  focusCount,
}: {
  mode: SolarWheelMode;
  onChange: (mode: SolarWheelMode) => void;
  focusCount: number;
}) {
  return (
    <div className="mx-auto mb-5 max-w-3xl text-center">
      <div className="inline-flex max-w-full rounded-full border border-black/10 bg-white/80 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {[
          { id: "all" as const, label: "Todos" },
          { id: "focus" as const, label: "En foco" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={[
              "rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition sm:px-4 sm:text-[11px] sm:tracking-[0.2em]",
              mode === option.id ? "bg-dusty-gold/16 text-[#5c4a24]" : "text-[#3a3048] hover:text-ivory",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[#3a3048]">
        {mode === "focus"
          ? `Mostrando ${focusCount} puntos de la Revolución Solar: Sol, Luna y planetas en casas angulares.`
          : "Mostrando la Revolución Solar completa para leer el año entero."}
      </p>
    </div>
  );
}

export function SolarReturnPage({ natalChart, request, dictionary, readingId }: SolarReturnPageProps) {
  const locale = useStoredLocale();
  const solarCopy = dictionary.result.solarReturnPage;
  const defaultYear = currentSolarReturnYear(request);
  const [targetYear, setTargetYear] = useState(defaultYear);
  const [city, setCity] = useState(request?.selectedLocation?.displayName ?? natalChart.event.locationLabel);
  const [selectedLocation, setSelectedLocation] = useState<PlaceSuggestion | null>(request?.selectedLocation ?? null);
  const [solarChart, setSolarChart] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setAiReading] = useState("");
  const [solarData, setSolarData] = useState<SolarData>({});
  const [readingError, setReadingError] = useState<string | null>(null);
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [selectedCardKey, setSelectedCardKey] = useState("theme");
  const [biWheelSelected, setBiWheelSelected] = useState<{ id: ChartPointId; ring: "inner" | "outer" } | null>(null);
  const [solarWheelMode, setSolarWheelMode] = useState<SolarWheelMode>("all");
  const [chartHash, setChartHash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => defaultYear - 5 + index),
    [defaultYear],
  );
  const summaryTabs = ["theme", "area", "tone"];
  const summaryCards = solarData.cards?.length === 3 ? solarData.cards : [];
  const selectedSummaryCard = summaryCards.find((card) => card.key === selectedCardKey) ?? summaryCards[0] ?? null;
  const priorityAreas = solarData.priorities ?? [];
  const solarFocusIds = useMemo(() => {
    if (!solarChart) return [];
    return [...new Set(
      solarChart.points
        .filter((point) => point.id === "sun" || point.id === "moon" || [1, 4, 7, 10].includes(point.house))
        .map((point) => point.id),
    )];
  }, [solarChart]);
  const solarCacheKey = useMemo(() => {
    const locationKey = selectedLocation
      ? `${selectedLocation.lat.toFixed(4)},${selectedLocation.lng.toFixed(4)}`
      : city.trim().toLowerCase();
    return `solar-return:${targetYear}:${locale}:${request?.gender || "unspecified"}:${locationKey}`;
  }, [city, locale, request?.gender, selectedLocation, targetYear]);

  useEffect(() => {
    setBiWheelSelected(null);
  }, [solarChart]);

  useEffect(() => {
    setBiWheelSelected(null);
  }, [solarWheelMode]);

  useEffect(() => {
    const rawSelection = window.localStorage.getItem(SOLAR_RETURN_SELECTION_KEY);
    if (!rawSelection) return;

    try {
      const storedSelection = JSON.parse(rawSelection) as Partial<StoredSolarReturnSelection>;
      if (typeof storedSelection.targetYear === "number") {
        setTargetYear(storedSelection.targetYear);
      }
      if (typeof storedSelection.city === "string" && storedSelection.city.trim()) {
        setCity(storedSelection.city);
      }
      if (storedSelection.selectedLocation) {
        setSelectedLocation(storedSelection.selectedLocation);
      }
    } catch {
      window.localStorage.removeItem(SOLAR_RETURN_SELECTION_KEY);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void hashNatalChart(natalChart).then((hash) => {
      if (active) setChartHash(hash);
    });
    return () => {
      active = false;
    };
  }, [natalChart]);

  useEffect(() => {
    if (!chartHash || solarChart) return;
    const cachedReading = getCachedPremiumReading<CachedSolarReturnReading>(chartHash, solarCacheKey);
    if (!cachedReading) return;

    setSolarChart(cachedReading.chart);
    setSolarData(normalizeSolarData(cachedReading.data));
    setAiReading("");
    setReadingError(null);
    setSelectedCardKey("theme");
    setIsLoadingReading(false);
  }, [chartHash, solarCacheKey, solarChart]);

  function calculate() {
    setError(null);
    if (chartHash) {
      const cachedReading = getCachedPremiumReading<CachedSolarReturnReading>(chartHash, solarCacheKey);
      if (cachedReading) {
        window.localStorage.setItem(SOLAR_RETURN_SELECTION_KEY, JSON.stringify({ targetYear, city, selectedLocation }));
        setSolarChart(cachedReading.chart);
        setSolarData(normalizeSolarData(cachedReading.data));
        setAiReading("");
        setReadingError(null);
        setSelectedCardKey("theme");
        setIsLoadingReading(false);
        return;
      }
    }
    startTransition(async () => {
      const result = await calculateSolarReturnAction({
        natalChart,
        request,
        targetYear,
        city,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
      });

      if (result.ok) {
        window.localStorage.setItem(SOLAR_RETURN_SELECTION_KEY, JSON.stringify({ targetYear, city, selectedLocation }));
        setSolarChart(result.chart);
        setAiReading("");
        setSolarData({});
        setReadingError(null);
        setSelectedCardKey("theme");
        setIsLoadingReading(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), READING_TIMEOUT_MS);
        void fetch("/api/solar-return-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            natalChartData: natalChart,
            solarReturnData: result.chart,
            locale,
            readingId,
            cacheKey: solarCacheKey,
            gender: request?.gender || undefined,
          }),
          signal: controller.signal,
        }).then(async (res) => {
          if (!res.ok || !res.body) {
            setReadingError(`${solarCopy.errorMessage} (${res.status})`);
            setIsLoadingReading(false);
            clearTimeout(timeout);
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value);
            setAiReading(accumulated.split(SARITA_DATA_MARKER)[0] ?? accumulated);
          }

          const rawPayload = accumulated.split(SARITA_DATA_MARKER)[1]?.trim() ?? "";
          const jsonPayload = cleanJsonPayload(rawPayload);
          if (jsonPayload) {
            try {
              const parsedData = normalizeSolarData(JSON.parse(jsonPayload) as SolarData);
              setSolarData(parsedData);
              if (chartHash) {
                setCachedPremiumReading<CachedSolarReturnReading>(chartHash, solarCacheKey, {
                  chart: result.chart,
                  data: parsedData,
                });
              }
            } catch {
              setReadingError(`${solarCopy.errorMessage} JSON`);
              // JSON parse failed — solarData stays empty, fallback cards show
            }
          } else {
            setReadingError(`${solarCopy.errorMessage} DATA`);
          }

          setIsLoadingReading(false);
          clearTimeout(timeout);
        }).catch(() => {
          clearTimeout(timeout);
          setReadingError(`${solarCopy.errorMessage} TIMEOUT`);
          setIsLoadingReading(false);
        });
      } else {
        setError(result.error ?? solarCopy.errorMessage);
      }
    });
  }

  if (solarChart) {
    return (
      <section className="py-10">
        <WheelModeToggle
          mode={solarWheelMode}
          onChange={setSolarWheelMode}
          focusCount={solarFocusIds.length}
        />
        <BiWheelChart
          innerChart={natalChart}
          outerChart={solarChart}
          innerLabel={natalChart.event.name}
          outerLabel={`RS ${targetYear}`}
          variant="solar-return"
          innerPointIds={solarWheelMode === "focus" ? solarFocusIds : undefined}
          outerPointIds={solarWheelMode === "focus" ? solarFocusIds : undefined}
          onInnerPlanetSelect={(id) => setBiWheelSelected({ id, ring: "inner" })}
          onOuterPlanetSelect={(id) => setBiWheelSelected({ id, ring: "outer" })}
        />
        {biWheelSelected ? (
          <BiWheelInfoPanel
            variant="solar-return"
            selectedId={biWheelSelected.id}
            ring={biWheelSelected.ring}
            innerChart={natalChart}
            outerChart={solarChart}
            onClose={() => setBiWheelSelected(null)}
          />
        ) : null}

        <div className="mx-auto mt-10 max-w-5xl">
          <div className="flex gap-0 border border-black/10">
            {summaryTabs.map((key) => {
              const active = selectedCardKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCardKey(key)}
                  className={[
                    "flex-1 border-r border-black/10 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] transition last:border-r-0",
                    active
                      ? "bg-dusty-gold/[0.07] text-[#5c4a24]"
                      : "bg-white text-[#3a3048] hover:bg-black/[0.02]",
                  ].join(" ")}
                >
                  {cardTabLabel(key, solarCopy)}
                </button>
              );
            })}
          </div>

          {isLoadingReading && !solarData.cards?.length ? (
            <article className="mt-4 min-h-[160px] animate-pulse border border-black/10 bg-white p-6">
              <div className="h-3 w-20 rounded bg-black/8" />
              <div className="mt-3 h-6 w-3/4 rounded bg-black/8" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-black/6" />
                <div className="h-3 w-5/6 rounded bg-black/6" />
              </div>
            </article>
          ) : readingError && !solarData.cards?.length ? (
            <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {selectedSummaryCard?.key.toUpperCase() ?? "AI"}
              </p>
              <h3 className="mt-2 break-words font-serif text-[22px] leading-snug text-ivory sm:text-[24px]">
                {solarCopy.errorMessage}
              </h3>
              <p className="mt-3 text-sm leading-7 text-red-700">{readingError}</p>
            </article>
          ) : selectedSummaryCard ? (
            <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {cardTabLabel(selectedSummaryCard.key, solarCopy).toUpperCase()}
              </p>
              <h3 className="mt-2 break-words font-serif text-[22px] leading-snug text-ivory sm:text-[24px]">
                {selectedSummaryCard.title}
              </h3>
              {selectedSummaryCard.body ? (
                <p className="mt-3 text-sm leading-7 text-[#3a3048]">{selectedSummaryCard.body}</p>
              ) : null}
            </article>
          ) : null}
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <div>
            <p className="font-serif text-2xl text-ivory">{solarCopy.priorityTitle}</p>
            {isLoadingReading && !solarData.priorities?.length ? (
              <div className="mt-4 animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 border-b border-black/[0.06] py-4">
                    <div className="h-7 w-8 rounded bg-black/8" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-black/8" />
                      <div className="h-3 w-full rounded bg-black/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                {priorityAreas.map((area, index) => (
                  <article key={area.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-b border-black/[0.06] py-4 last:border-b-0">
                    <p className="font-serif text-[26px] leading-none text-[#8a7a4e]">
                      {index + 1}
                    </p>
                    <div>
                      <h3 className="text-sm font-semibold leading-6 text-ivory">
                        {area.title}
                      </h3>
                      {area.body ? <p className="mt-1 text-sm leading-7 text-[#3a3048]">{area.body}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          <PrimaryButton
            type="button"
            variant="ghostGold"
            className="mt-6 px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
            onClick={() => setSolarChart(null)}
          >
            {solarCopy.changeYear}
          </PrimaryButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl py-16">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {solarCopy.eyebrow}
      </p>
      <h2 className="mt-2 break-words font-serif text-[32px] leading-tight text-ivory sm:text-[52px]">{solarCopy.title}</h2>
      <p className="mt-5 max-w-xl text-sm leading-7 text-[#3a3048]">
        {solarCopy.intro}
      </p>
      <div className="mt-8 grid gap-5">
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">Año</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={targetYear === year}
                onClick={() => setTargetYear(year)}
                className={[
                  "rounded-full border px-3 py-2.5 text-sm font-semibold transition",
                  targetYear === year
                    ? "border-dusty-gold/70 bg-dusty-gold/18 text-dusty-gold"
                    : "border-black/15 bg-black/[0.05] text-[#3a3048] hover:border-black/15 hover:text-ivory",
                ].join(" ")}
              >
                {year}
              </button>
            ))}
          </div>
        </label>
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
            {solarCopy.cityQuestion}
          </span>
          <div className="mt-2">
            <LocationAutocomplete
              value={city}
              selectedLocation={selectedLocation}
              onInputChange={(value) => {
                setCity(value);
                if (selectedLocation?.displayName !== value) setSelectedLocation(null);
              }}
              onSelect={(place) => {
                setCity(place.displayName);
                setSelectedLocation(place);
              }}
              dictionary={dictionary}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-[#3a3048]">{solarCopy.cityHint}</p>
        </div>
        {error ? <p className="text-sm text-amber-100/80">{error}</p> : null}
        <PrimaryButton type="button" onClick={calculate} disabled={isPending}>
          {isPending ? solarCopy.calculating : solarCopy.viewYear.replace("{year}", String(targetYear))}
        </PrimaryButton>
      </div>
    </section>
  );
}
