"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { BiWheelInfoPanel } from "@/components/chart/bi-wheel-info-panel";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { calculateCurrentTransitsAction } from "@/lib/actions";
import type { ChartPoint, ChartPointId, HouseCusp, NatalChartData } from "@/lib/chart";
import { normalizeLongitude } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { getCachedPremiumReading, setCachedPremiumReading } from "@/lib/premium-reading-cache";
import { normalizeReadingText } from "@/lib/reading-text";
import type { ActiveTransit } from "@/lib/transits.server";
import { getAspectLabel, getHouseArea, getPointLabel } from "@/lib/chart-labels";

type ChartCompletePageProps = {
  chart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
  readingId?: string;
};

type TransitResult = Awaited<ReturnType<typeof calculateCurrentTransitsAction>>;
type CachedTransitResult = Extract<TransitResult, { ok: true }>;
type TransitData = {
  dominantTitle?: string;
  dominantBody?: string;
  planetLanguage?: string;
  houses?: Array<{ house: number; title: string; body: string }>;
  readingGeneratedAt?: string;
};

type TransitWheelMode = "all" | "active";

const SARITA_DATA_MARKER = "__SARITA_DATA__";
const READING_TIMEOUT_MS = 45000;

const POINT_LABELS: Partial<Record<ChartPointId, string>> = {
  sun: "Sol",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "Plutón",
  northNode: "Nodo norte",
  southNode: "Nodo sur",
  chiron: "Quirón",
};

const ASPECT_LABELS: Record<ActiveTransit["aspectType"], string> = {
  conjunction: "toca directamente",
  opposition: "pone en espejo",
  square: "tensiona",
  trine: "abre una vía fluida hacia",
  sextile: "ofrece una oportunidad a",
  quincunx: "pide ajustar",
};

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad, cuerpo y forma de entrar en la vida",
  2: "valor propio, dinero y seguridad interna",
  3: "voz, mente cotidiana, aprendizaje y conversaciones",
  4: "raíz emocional, hogar, familia y pertenencia",
  5: "deseo, creatividad, placer y expresión personal",
  6: "hábitos, trabajo diario, salud y orden corporal",
  7: "pareja, vínculos, acuerdos y espejos relacionales",
  8: "intimidad, sombra, duelos, poder y transformación",
  9: "sentido, fe, viajes, estudios y visión de mundo",
  10: "vocación, visibilidad, autoridad y dirección vital",
  11: "amistades, redes, comunidad y futuro compartido",
  12: "inconsciente, descanso, cierre de ciclos y vida espiritual",
};

function ReadingSkeleton() {
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

function pointLabel(id: ChartPointId, locale?: string) {
  return getPointLabel(id, locale);
}

function lifecycleTransitLabel(transit: Pick<ActiveTransit, "lifecycleEvent">, locale?: string) {
  if (!transit.lifecycleEvent) return "";
  const labels: Record<NonNullable<ActiveTransit["lifecycleEvent"]>, Record<"es" | "en" | "it", string>> = {
    "jupiter-return": { es: "Retorno de Júpiter", en: "Jupiter return", it: "Ritorno di Giove" },
    "jupiter-opposition": { es: "Oposición de Júpiter", en: "Jupiter opposition", it: "Opposizione di Giove" },
    "saturn-return": { es: "Retorno de Saturno", en: "Saturn return", it: "Ritorno di Saturno" },
    "saturn-opposition": { es: "Oposición de Saturno", en: "Saturn opposition", it: "Opposizione di Saturno" },
    "uranus-return": { es: "Retorno de Urano", en: "Uranus return", it: "Ritorno di Urano" },
    "uranus-opposition": { es: "Oposición de Urano", en: "Uranus opposition", it: "Opposizione di Urano" },
  };
  const language = locale === "en" || locale === "it" ? locale : "es";
  return labels[transit.lifecycleEvent][language];
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

function WheelModeToggle({
  mode,
  onChange,
  activeCount,
  copy,
}: {
  mode: TransitWheelMode;
  onChange: (mode: TransitWheelMode) => void;
  activeCount: number;
  copy: Dictionary["result"]["transitPage"];
}) {
  return (
    <div className="mx-auto mb-5 max-w-3xl text-center">
      <div className="inline-flex max-w-full rounded-full border border-black/10 bg-white/80 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {[
          { id: "all" as const, label: copy.wheelAll },
          { id: "active" as const, label: copy.wheelActive },
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
        {mode === "active"
          ? copy.wheelActiveDescription.replace("{count}", String(activeCount))
          : copy.wheelAllDescription}
      </p>
    </div>
  );
}

function normalizeTransitData(data: TransitData): TransitData {
  return {
    dominantTitle: data.dominantTitle ? normalizeReadingText(data.dominantTitle) : undefined,
    dominantBody: data.dominantBody ? normalizeReadingText(data.dominantBody) : undefined,
    planetLanguage: data.planetLanguage ? normalizeReadingText(data.planetLanguage) : undefined,
    houses: data.houses?.map((house) => ({
      house: house.house,
      title: normalizeReadingText(house.title),
      body: normalizeReadingText(house.body),
    })),
    readingGeneratedAt: data.readingGeneratedAt,
  };
}

function findPoint(chart: NatalChartData, id: ChartPointId) {
  return chart.points.find((point) => point.id === id) ?? chart.extendedPoints?.find((point) => point.id === id);
}

function getHouseForLongitude(longitude: number, houses: HouseCusp[]) {
  const normalized = normalizeLongitude(longitude);
  for (let index = 0; index < houses.length; index += 1) {
    const current = houses[index]!;
    const next = houses[(index + 1) % houses.length]!;
    const start = normalizeLongitude(current.longitude);
    const end = normalizeLongitude(next.longitude);
    const inHouse = start <= end
      ? normalized >= start && normalized < end
      : normalized >= start || normalized < end;
    if (inHouse) return current.house;
  }
  return houses[houses.length - 1]?.house ?? 12;
}

function transitWeight(transit: ActiveTransit) {
  const planetWeight: Partial<Record<ChartPointId, number>> = {
    pluto: 6,
    neptune: 5,
    uranus: 5,
    saturn: 5,
    jupiter: 4,
    mars: 3,
    venus: 2,
  };
  const aspectWeight: Record<ActiveTransit["aspectType"], number> = {
    conjunction: 3,
    opposition: 2.6,
    square: 2.4,
    trine: 1.8,
    sextile: 1.4,
    quincunx: 1.6,
  };
  const tightness = transit.strength === "tight" ? 3 : transit.strength === "moderate" ? 2 : 1;
  const natalPatternBonus = Math.min(1.5, transit.activatedNatalAspects.length * 0.35);
  const lifecycleBonus = transit.lifecycleEvent ? 2 : 0;
  return (planetWeight[transit.transitingPlanet] ?? 1) + aspectWeight[transit.aspectType] + tightness + natalPatternBonus + lifecycleBonus - transit.orb;
}

function topTransits(transits: ActiveTransit[]) {
  return [...transits].sort((a, b) => transitWeight(b) - transitWeight(a)).slice(0, 6);
}

function activatedHouses(chart: NatalChartData, transits: ActiveTransit[], transitChart?: NatalChartData) {
  const byHouse = new Map<number, { house: number; count: number; points: Set<string>; transits: ActiveTransit[] }>();

  topTransits(transits).forEach((transit) => {
    const natalPoint = findPoint(chart, transit.natalPlanet);
    const transitingPoint = transitChart ? findPoint(transitChart, transit.transitingPlanet) : null;
    const house = transitingPoint ? getHouseForLongitude(transitingPoint.longitude, chart.houses) : natalPoint?.house;
    if (!house) return;
    const current = byHouse.get(house) ?? {
      house,
      count: 0,
      points: new Set<string>(),
      transits: [],
    };
    current.count += 1;
    current.points.add(pointLabel(transit.transitingPlanet));
    current.transits.push(transit);
    byHouse.set(house, current);
  });

  return [...byHouse.values()].sort((a, b) => b.count - a.count).slice(0, 3);
}

function dateLabel(iso?: string, locale?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale ?? "es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function dayKey(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function ChartCompletePage({ chart, request, dictionary, readingId }: ChartCompletePageProps) {
  const locale = useStoredLocale();
  const transitCopy = dictionary.result.transitPage;
  const initialTransitLocation = request?.selectedLocation ?? null;
  const [result, setResult] = useState<TransitResult | null>(null);
  const [currentLocationInput, setCurrentLocationInput] = useState(initialTransitLocation?.displayName ?? request?.location ?? "");
  const [currentLocation, setCurrentLocation] = useState<PlaceSuggestion | null>(initialTransitLocation);
  const [transitReading, setTransitReading] = useState("");
  const [transitData, setTransitData] = useState<TransitData>({});
  const [transitReadingError, setTransitReadingError] = useState<string | null>(null);
  const [isLoadingTransitReading, setIsLoadingTransitReading] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [biWheelSelected, setBiWheelSelected] = useState<{ id: ChartPointId; ring: "inner" | "outer" } | null>(null);
  const [transitWheelMode, setTransitWheelMode] = useState<TransitWheelMode>("all");
  const [chartHash, setChartHash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const aiCacheHash = chartHash ? (readingId ? `reading:${readingId}:${chartHash}` : chartHash) : null;
  const currentLocationKey = currentLocation
    ? `${currentLocation.id}:${currentLocation.lat}:${currentLocation.lng}:${currentLocation.timezone}`
    : "birth-location";

  useEffect(() => {
    let active = true;
    void hashNatalChart(chart).then((hash) => {
      if (active) setChartHash(hash);
    });
    return () => {
      active = false;
    };
  }, [chart]);

  useEffect(() => {
    if (!chartHash) return;
    let active = true;
    const cacheKey = `transit-result:${new Date().toISOString().slice(0, 10)}:${currentLocationKey}`;
    const cachedResult = getCachedPremiumReading<CachedTransitResult>(chartHash, cacheKey);
    if (cachedResult) {
      setResult(cachedResult);
      return;
    }

    setResult(null);
    startTransition(async () => {
      const next = await calculateCurrentTransitsAction(chart, request, currentLocation);
      if (active) {
        setResult(next);
        if (next.ok) {
          setCachedPremiumReading(chartHash, cacheKey, next);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [chart, request, chartHash, currentLocation, currentLocationKey]);

  useEffect(() => {
    if (!result?.ok || result.transits.length === 0 || !chartHash || !aiCacheHash) return;
    let active = true;
    const cacheKey = `transits:v3:${locale}:${request?.gender || "unspecified"}:${currentLocationKey}`;
    const cachedData = getCachedPremiumReading<TransitData>(aiCacheHash, cacheKey);
    if (cachedData) {
      setTransitReading("");
      setTransitData(normalizeTransitData(cachedData));
      setTransitReadingError(null);
      setIsLoadingTransitReading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), READING_TIMEOUT_MS);
    const top = topTransits(result.transits).map(t => ({
      transitingPlanet: t.transitingPlanet,
      natalPlanet: t.natalPlanet,
      aspectType: t.aspectType,
      lifecycleEvent: t.lifecycleEvent,
      orb: t.orb,
      strength: t.strength,
      natalHouse: findPoint(chart, t.natalPlanet)?.house,
      transitingHouse: (() => {
        const transitingPoint = findPoint(result.chart, t.transitingPlanet);
        return transitingPoint ? getHouseForLongitude(transitingPoint.longitude, chart.houses) : undefined;
      })(),
      activatedNatalAspects: t.activatedNatalAspects,
    }));
    setTransitReading("");
    setTransitData({});
    setTransitReadingError(null);
    setIsLoadingTransitReading(true);
    void fetch("/api/transit-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, transits: top, locale, readingId, cacheKey, gender: request?.gender || undefined }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!active || !res.ok || !res.body) {
        clearTimeout(timeout);
        if (active) {
          setTransitReadingError(`Transit reading failed: ${res.status}`);
          setIsLoadingTransitReading(false);
        }
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value);
        if (active) setTransitReading(accumulated.split(SARITA_DATA_MARKER)[0] ?? accumulated);
      }
      if (active) {
        const markerIdx = accumulated.indexOf(SARITA_DATA_MARKER);
        if (markerIdx !== -1) {
          const jsonPayload = cleanJsonPayload(accumulated.slice(markerIdx + SARITA_DATA_MARKER.length).trim());
          try {
            const parsedData = normalizeTransitData({
              ...(JSON.parse(jsonPayload) as TransitData),
              readingGeneratedAt: result.generatedAt,
            });
            setTransitData(parsedData);
            setCachedPremiumReading(aiCacheHash, cacheKey, parsedData);
          } catch {
            setTransitReadingError("Transit reading JSON could not be parsed.");
          }
        } else {
          setTransitReadingError("Transit reading response did not include SARITA data.");
        }
        setIsLoadingTransitReading(false);
      }
      clearTimeout(timeout);
    }).catch(() => {
      clearTimeout(timeout);
      if (active) {
        setTransitReadingError("Transit reading request failed or timed out.");
        setIsLoadingTransitReading(false);
      }
    });
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [result, chart, locale, chartHash, aiCacheHash, readingId, request?.gender, currentLocationKey]);

  const activeTransits = useMemo(() => {
    if (!result?.ok) return [];
    return topTransits(result.transits);
  }, [result]);
  const activeTransitInnerIds = useMemo(() => [...new Set(activeTransits.map((transit) => transit.natalPlanet))], [activeTransits]);
  const activeTransitOuterIds = useMemo(() => [...new Set(activeTransits.map((transit) => transit.transitingPlanet))], [activeTransits]);

  const houses = useMemo(() => activatedHouses(chart, activeTransits, result?.ok ? result.chart : undefined), [chart, activeTransits, result]);
  const dominantTransit = activeTransits[0];
  const aiHouses = useMemo(() => transitData.houses ?? [], [transitData.houses]);
  const selectedAiHouse = aiHouses.find((house) => house.house === selectedHouse) ?? aiHouses[0] ?? null;
  const readingGeneratedAt = transitData.readingGeneratedAt;
  const showReadingDateNote = Boolean(
    result?.ok &&
    readingGeneratedAt &&
    dayKey(readingGeneratedAt) !== dayKey(result.generatedAt),
  );

  useEffect(() => {
    if (!aiHouses.length) {
      setSelectedHouse(null);
      return;
    }

    setSelectedHouse((current) => (
      current && aiHouses.some((house) => house.house === current) ? current : aiHouses[0]!.house
    ));
  }, [aiHouses]);

  useEffect(() => {
    setBiWheelSelected(null);
  }, [transitWheelMode]);

  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {transitCopy.eyebrow}
        </p>
        <h2 className="mt-2 break-words font-serif text-[34px] leading-tight text-ivory sm:text-[42px] md:text-[56px]">
          {transitCopy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#3a3048]">
          {transitCopy.description}
        </p>
        <div className="mx-auto mt-8 max-w-3xl border-y border-dusty-gold/24 bg-[#f8f4eb]/42 px-4 py-5 text-left shadow-[0_14px_46px_rgba(30,26,46,0.05)] backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="grid gap-5 md:grid-cols-[0.82fr_1.18fr] md:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a7a4e]">
                {transitCopy.currentSkyFor}
              </p>
              <p className="mt-3 font-serif text-[28px] leading-tight text-ivory sm:text-[34px]">
                {currentLocation?.displayName ?? request?.location ?? chart.event.locationLabel}
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24]">
                {result?.ok ? dateLabel(result.generatedAt, locale) : transitCopy.nowLabel ?? "Now"}
              </p>
            </div>
            <div className="pt-0">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                  {transitCopy.changeCurrentLocation}
                </span>
                <div className="mt-2 [&_input]:min-h-[3.65rem] [&_input]:border-dusty-gold/28 [&_input]:bg-[#f5f0e6]/80 [&_input]:shadow-none">
                  <LocationAutocomplete
                    value={currentLocationInput}
                    selectedLocation={currentLocation}
                    onInputChange={(value) => {
                      setCurrentLocationInput(value);
                      if (currentLocation?.displayName !== value) setCurrentLocation(null);
                    }}
                    onSelect={(place) => {
                      setCurrentLocationInput(place.displayName);
                      setCurrentLocation(place);
                    }}
                    dictionary={dictionary}
                  />
                </div>
              </label>
              <p className="mt-3 text-xs leading-5 text-[#3a3048]">
                {transitCopy.currentLocationNote}
              </p>
            </div>
          </div>
        </div>
        {result?.ok ? (
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24]">
            {transitCopy.calculatedAt} {dateLabel(result.generatedAt, locale)}
            {currentLocation ? ` · ${currentLocation.displayName}` : ""}
          </p>
        ) : null}
        {showReadingDateNote ? (
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-[#3a3048]">
            {formatTemplate(transitCopy.readingGeneratedOnNote, {
              date: dateLabel(readingGeneratedAt, locale),
            })}
          </p>
        ) : null}
      </div>

      <div className="mt-10">
        {result?.ok ? (
          <>
            <WheelModeToggle
              mode={transitWheelMode}
              onChange={setTransitWheelMode}
              activeCount={activeTransitInnerIds.length + activeTransitOuterIds.length}
              copy={transitCopy}
            />
            <BiWheelChart
              innerChart={chart}
              outerChart={result.chart}
              innerLabel={chart.event.name}
              outerLabel={dictionary.result.primaryTabs.complete}
              variant="synastry"
              innerPointIds={transitWheelMode === "active" ? activeTransitInnerIds : undefined}
              outerPointIds={transitWheelMode === "active" ? activeTransitOuterIds : undefined}
              onInnerPlanetSelect={(id) => setBiWheelSelected({ id, ring: "inner" })}
              onOuterPlanetSelect={(id) => setBiWheelSelected({ id, ring: "outer" })}
            />
            {biWheelSelected ? (
              <BiWheelInfoPanel
                variant="transits"
                selectedId={biWheelSelected.id}
                ring={biWheelSelected.ring}
                innerChart={chart}
                outerChart={result.chart}
                activeTransits={activeTransits}
                onClose={() => setBiWheelSelected(null)}
              />
            ) : null}
          </>
        ) : (
          <div className="mx-auto flex min-h-[280px] max-w-[860px] items-center justify-center border border-black/10 bg-white p-5 text-center shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:min-h-[420px]">
            <div>
              <p className="font-serif text-3xl text-ivory">{isPending ? transitCopy.calculatingHeading : transitCopy.errorHeading}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#3a3048]">
                {isPending
                  ? transitCopy.calculatingBody
                  : transitCopy.errorBody}
              </p>
            </div>
          </div>
        )}
      </div>

      {dominantTransit ? (
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-[1.05fr_0.95fr]">
          <article className="border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              {transitCopy.mostActiveEyebrow}
            </p>
            {isLoadingTransitReading && !transitData.dominantTitle ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-6 w-3/4 rounded bg-black/8" />
                <div className="h-3 w-full rounded bg-black/6" />
                <div className="h-3 w-5/6 rounded bg-black/6" />
              </div>
            ) : transitReadingError && !transitData.dominantTitle ? (
              <p className="mt-3 text-sm leading-7 text-red-700">{transitReadingError}</p>
            ) : (
              <>
                {transitData.dominantTitle ? (
                  <h3 className="mt-2 break-words font-serif text-[21px] leading-snug text-ivory sm:text-[22px]">
                    {transitData.dominantTitle}
                  </h3>
                ) : null}
                {transitData.dominantBody ? (
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">
                    {transitData.dominantBody}
                  </p>
                ) : null}
              </>
            )}
          </article>

          <article className="border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              {transitCopy.planetLanguageEyebrow}
            </p>
            {isLoadingTransitReading && !transitData.planetLanguage ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-3 w-full rounded bg-black/6" />
                <div className="h-3 w-5/6 rounded bg-black/6" />
              </div>
            ) : transitReadingError && !transitData.planetLanguage ? (
              <p className="mt-3 text-sm leading-7 text-red-700">{transitReadingError}</p>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#3a3048]">
                {transitData.planetLanguage}
              </p>
            )}
            <p className="mt-4 text-sm leading-7 text-[#3a3048]">
              {transitCopy.orbLabel} {dominantTransit.orb}° · {dominantTransit.strength === "tight" ? transitCopy.strengthTight : dominantTransit.strength === "moderate" ? transitCopy.strengthModerate : transitCopy.strengthLoose}
            </p>
          </article>
        </div>
      ) : result?.ok ? (
        <div className="mx-auto mt-12 max-w-3xl border border-black/12 bg-white p-7 text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <h3 className="font-serif text-3xl text-ivory">{transitCopy.silentSkyHeading}</h3>
          <p className="mt-4 text-sm leading-7 text-[#3a3048]">
            {transitCopy.silentSkyBody}
          </p>
        </div>
      ) : null}

      {activeTransits.length > 0 ? (
        <div className="mx-auto mt-12 max-w-5xl">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            {transitCopy.activatedAreasEyebrow}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {isLoadingTransitReading && !aiHouses.length
              ? houses.slice(0, 3).map((entry) => (
                  <span key={entry.house} className="h-9 w-24 animate-pulse border border-black/10 bg-white" />
                ))
              : aiHouses.map((house) => {
                  const active = selectedAiHouse?.house === house.house;
                  return (
                    <button
                      key={house.house}
                      type="button"
                      onClick={() => setSelectedHouse(house.house)}
                      className={[
                        "border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                        active
                          ? "border-dusty-gold/60 bg-dusty-gold/[0.07] text-[#5c4a24]"
                          : "border-black/10 bg-white text-[#3a3048] hover:bg-black/[0.02]",
                      ].join(" ")}
                    >
                      {transitCopy.housePrefix} {house.house}
                    </button>
                  );
                })}
          </div>
          {isLoadingTransitReading && !selectedAiHouse ? (
            <ReadingSkeleton />
          ) : transitReadingError && !selectedAiHouse ? (
            <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {transitCopy.activatedAreasEyebrow}
              </p>
              <p className="mt-3 text-sm leading-7 text-red-700">{transitReadingError}</p>
            </article>
          ) : selectedAiHouse ? (
            <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {transitCopy.housePrefix} {selectedAiHouse.house} ·{" "}
                {dictionary.result.houseMeanings[String(selectedAiHouse.house) as keyof typeof dictionary.result.houseMeanings] ??
                  getHouseArea(selectedAiHouse.house, locale)}
              </p>
              <h3 className="mt-2 break-words font-serif text-[22px] leading-snug text-ivory sm:text-[24px]">
                {selectedAiHouse.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#3a3048]">{selectedAiHouse.body}</p>
            </article>
          ) : null}
        </div>
      ) : null}

      {activeTransits.length > 0 ? (
        <details className="mx-auto mt-10 max-w-5xl border-y border-black/10">
          <summary className="cursor-pointer list-none py-4 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24]">
            {transitCopy.viewTransits}
          </summary>
          <div className="grid gap-3 pb-6">
            {activeTransits.map((transit) => (
              <div
                key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
                className="flex items-center justify-between gap-4 border border-black/12 bg-white px-4 py-3"
              >
                <p className="text-sm text-[#5c4a24]">
                  {lifecycleTransitLabel(transit, locale) ||
                    `${pointLabel(transit.transitingPlanet, locale)} ${getAspectLabel(transit.aspectType, locale).toLowerCase()} ${pointLabel(transit.natalPlanet, locale)}`}
                </p>
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a7a4e]">
                  {transit.orb.toFixed(1)}°
                </span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
