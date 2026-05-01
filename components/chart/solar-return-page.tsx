"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { BiWheelInfoPanel } from "@/components/chart/bi-wheel-info-panel";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { calculateSolarReturnAction } from "@/lib/actions";
import { formatSignPosition, type ChartPointId, type NatalChartData } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";

type SolarReturnPageProps = {
  natalChart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
};

type SolarData = {
  cards?: Array<{ key: string; title: string; body: string }>;
  priorities?: Array<{ title: string; body: string }>;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";
const READING_TIMEOUT_MS = 45000;

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad y cuerpo",
  2: "recursos y valor propio",
  3: "voz, mente y entorno",
  4: "hogar y raiz emocional",
  5: "creatividad y deseo",
  6: "rutina, salud y oficio",
  7: "vinculos y acuerdos",
  8: "intimidad y transformacion",
  9: "sentido, viajes y expansion",
  10: "direccion publica",
  11: "redes y futuro",
  12: "cierre, descanso e inconsciente",
};

function currentSolarReturnYear(request: FormValues | null) {
  const now = new Date();
  const birthDate = request?.birthDate ? new Date(`${request.birthDate}T00:00:00`) : null;
  if (!birthDate) return now.getFullYear();

  const birthdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  return now >= birthdayThisYear ? now.getFullYear() : now.getFullYear() - 1;
}

function solarPriorityAreas(sunHouse: number, moonHouse: number) {
  return [
    { title: `Prioriza ${HOUSE_AREAS[sunHouse]}`, body: "" },
    { title: `Cuida ${HOUSE_AREAS[moonHouse]}`, body: "" },
    { title: "Reduce ruido innecesario", body: "" },
  ];
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

export function SolarReturnPage({ natalChart, request, dictionary }: SolarReturnPageProps) {
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
  const [isPending, startTransition] = useTransition();
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => defaultYear - 5 + index),
    [defaultYear],
  );
  const rsAscendantPosition = solarChart ? formatSignPosition(solarChart.meta.ascendant) : null;
  const rsAscendantSign = rsAscendantPosition ? dictionary.result.signs[rsAscendantPosition.sign] : "";
  const rsMoon = solarChart?.points.find((point) => point.id === "moon");
  const rsSun = solarChart?.points.find((point) => point.id === "sun");
  const fallbackCards = [
    { key: "theme", title: solarCopy.themeCard, body: rsAscendantPosition ? `Ascendente ${rsAscendantSign}` : "Ascendente -" },
    { key: "area", title: solarCopy.areaCard, body: `Sol · Casa ${rsSun?.house ?? "-"}` },
    { key: "tone", title: solarCopy.toneCard, body: `Luna · ${rsMoon ? dictionary.result.signs[rsMoon.sign] : "-"}` },
  ];
  const summaryCards = solarData.cards?.length === 3 ? solarData.cards : fallbackCards;
  const selectedSummaryCard = summaryCards.find((card) => card.key === selectedCardKey) ?? summaryCards[0];
  const priorityAreas = solarData.priorities ?? (solarChart ? solarPriorityAreas(rsSun?.house ?? 1, rsMoon?.house ?? 4) : []);

  useEffect(() => {
    setBiWheelSelected(null);
  }, [solarChart]);

  function calculate() {
    setError(null);
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
          body: JSON.stringify({ natalChartData: natalChart, solarReturnData: result.chart, locale }),
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
              setSolarData(JSON.parse(jsonPayload) as SolarData);
            } catch {
              // JSON parse failed — solarData stays empty, fallback cards show
            }
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
        <BiWheelChart
          innerChart={natalChart}
          outerChart={solarChart}
          innerLabel={natalChart.event.name}
          outerLabel={`RS ${targetYear}`}
          variant="solar-return"
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
            {summaryCards.map((card) => {
              const active = selectedSummaryCard?.key === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setSelectedCardKey(card.key)}
                  className={[
                    "flex-1 border-r border-black/10 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] transition last:border-r-0",
                    active
                      ? "bg-dusty-gold/[0.07] text-[#5c4a24]"
                      : "bg-white text-[#3a3048] hover:bg-black/[0.02]",
                  ].join(" ")}
                >
                  {cardTabLabel(card.key, solarCopy)}
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
              <h3 className="mt-2 font-serif text-[24px] leading-snug text-ivory">
                {solarCopy.errorMessage}
              </h3>
              <p className="mt-3 text-sm leading-7 text-red-700">{readingError}</p>
            </article>
          ) : selectedSummaryCard ? (
            <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                {selectedSummaryCard.key.toUpperCase()}
              </p>
              <h3 className="mt-2 font-serif text-[24px] leading-snug text-ivory">
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
      <h2 className="mt-2 font-serif text-[34px] leading-tight text-ivory sm:text-[52px]">{solarCopy.title}</h2>
      <p className="mt-5 max-w-xl text-sm leading-7 text-[#3a3048]">
        {solarCopy.intro}
      </p>
      <div className="mt-8 grid gap-5">
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">Año</span>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
