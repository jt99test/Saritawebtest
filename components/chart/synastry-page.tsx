"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { BiWheelInfoPanel } from "@/components/chart/bi-wheel-info-panel";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  deleteSynastryPartnerAction,
  getSynastryPartnersAction,
  saveAndCalculateSynastryPartnerAction,
  type SynastryPartnerInput,
} from "@/lib/actions";
import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import { clampIsoDateYear } from "@/lib/date-input";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { getCachedPremiumReading, setCachedPremiumReading } from "@/lib/premium-reading-cache";
import { normalizeReadingText, splitReading } from "@/lib/reading-text";
import type { ReadingGender } from "@/lib/reading-gender";
import { calculateSynastryAspects, type SynastryAspect } from "@/lib/synastry";

type SynastryPageProps = {
  natalChart: NatalChartData;
  dictionary: Dictionary;
  readingId?: string;
  gender?: ReadingGender;
};

type SynastryData = {
  compatibilityLabel?: string;
  compatibilityDescription?: string;
  layers?: Record<string, string>;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";
const READING_TIMEOUT_MS = 45000;
const SELECTED_PARTNER_STORAGE_KEY = "sarita_synastry_selected_partner";
const SELECTED_PARTNER_DATA_STORAGE_KEY = "sarita_synastry_selected_partner_data";

type PartnerRow = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_city: string;
  chart_data: NatalChartData | null;
};

type SynastryLayerId = "fisico" | "sexual" | "emocional" | "mental" | "profesional" | "evolutivo";
type SynastryWheelMode = "all" | "aspected";

const LAYERS: Array<{
  id: SynastryLayerId;
  points: ChartPointId[];
}> = [
  { id: "fisico", points: ["venus", "mars", "sun", "moon"] },
  { id: "sexual", points: ["venus", "mars", "pluto", "moon"] },
  { id: "emocional", points: ["moon", "venus", "neptune"] },
  { id: "mental", points: ["mercury", "jupiter", "uranus"] },
  { id: "profesional", points: ["sun", "mercury", "jupiter", "saturn", "mars"] },
  { id: "evolutivo", points: ["northNode", "saturn", "pluto", "uranus", "neptune"] },
];

function qualityBreakdown(aspects: SynastryAspect[]) {
  const total = Math.max(1, aspects.length);
  const harmonious = aspects.filter((aspect) => aspect.quality === "harmonious").length;
  const tense = aspects.filter((aspect) => aspect.quality === "tense").length;
  const neutral = aspects.length - harmonious - tense;
  return {
    harmonious: Math.round((harmonious / total) * 100),
    tense: Math.round((tense / total) * 100),
    neutral: Math.round((neutral / total) * 100),
  };
}

function CompatibilityRing({ aspects, dictionary }: { aspects: SynastryAspect[]; dictionary: Dictionary }) {
  const breakdown = qualityBreakdown(aspects);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const harmoniousLength = (breakdown.harmonious / 100) * circumference;
  const tenseLength = (breakdown.tense / 100) * circumference;
  const neutralLength = Math.max(0, circumference - harmoniousLength - tenseLength);

  return (
    <svg viewBox="0 0 170 170" className="mx-auto h-40 w-40" role="img" aria-label={dictionary.result.synastryPage.compatibilityAria}>
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="16" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(130,146,214,0.88)" strokeWidth="16" strokeDasharray={`${harmoniousLength} ${circumference}`} transform="rotate(-90 85 85)" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(245,190,105,0.78)" strokeWidth="16" strokeDasharray={`${tenseLength} ${circumference}`} strokeDashoffset={-harmoniousLength} transform="rotate(-90 85 85)" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(181,163,110,0.78)" strokeWidth="16" strokeDasharray={`${neutralLength} ${circumference}`} strokeDashoffset={-(harmoniousLength + tenseLength)} transform="rotate(-90 85 85)" />
      <text x="85" y="80" textAnchor="middle" className="font-serif text-[22px]" fill="#1e1a2e">{aspects.length}</text>
      <text x="85" y="101" textAnchor="middle" className="text-[12px] uppercase tracking-[0.16em]" fill="#3a3048">{dictionary.result.synastryPage.aspectsCount}</text>
    </svg>
  );
}

function WheelModeToggle({
  mode,
  onChange,
  activeCount,
}: {
  mode: SynastryWheelMode;
  onChange: (mode: SynastryWheelMode) => void;
  activeCount: number;
}) {
  return (
    <div className="mx-auto mb-5 max-w-3xl text-center">
      <div className="inline-flex rounded-full border border-black/10 bg-white/80 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {[
          { id: "all" as const, label: "Todos" },
          { id: "aspected" as const, label: "Aspectos" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={[
              "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
              mode === option.id ? "bg-dusty-gold/16 text-[#5c4a24]" : "text-[#3a3048] hover:text-ivory",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[#3a3048]">
        {mode === "aspected"
          ? `Mostrando solo los ${activeCount} planetas que forman aspectos entre las dos cartas.`
          : "Mostrando ambas cartas completas para leer el contexto del vínculo."}
      </p>
    </div>
  );
}

function localPartnerFromForm(form: SynastryPartnerInput, chart: NatalChartData): PartnerRow {
  return {
    id: `local-${Date.now()}`,
    name: form.name,
    birth_date: form.birthDate,
    birth_time: form.birthTime || "12:00",
    birth_city: form.birthCity,
    chart_data: chart,
  };
}

function readStoredPartner(): PartnerRow | null {
  const rawPartner = window.localStorage.getItem(SELECTED_PARTNER_DATA_STORAGE_KEY);
  if (!rawPartner) return null;

  try {
    const parsed = JSON.parse(rawPartner) as Partial<PartnerRow>;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.birth_date === "string" &&
      typeof parsed.birth_city === "string" &&
      parsed.chart_data
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        birth_date: parsed.birth_date,
        birth_time: typeof parsed.birth_time === "string" ? parsed.birth_time : null,
        birth_city: parsed.birth_city,
        chart_data: parsed.chart_data as NatalChartData,
      };
    }
  } catch {
    window.localStorage.removeItem(SELECTED_PARTNER_DATA_STORAGE_KEY);
  }

  return null;
}

function pointLabel(id: ChartPointId, dictionary: Dictionary) {
  return dictionary.result.points[id] ?? id;
}

function aspectsForLayer(aspects: SynastryAspect[], layer: (typeof LAYERS)[number]) {
  const layerPoints = new Set(layer.points);
  return aspects.filter((aspect) => layerPoints.has(aspect.pointA) || layerPoints.has(aspect.pointB)).slice(0, 4);
}

function layerReading(
  aspects: SynastryAspect[],
  layer: (typeof LAYERS)[number],
  dictionary: Dictionary,
) {
  const personalPoints = new Set<ChartPointId>(["sun", "moon", "venus", "mars"]);
  const selected = aspectsForLayer(aspects, layer)
    .filter((aspect) => personalPoints.has(aspect.pointA) || personalPoints.has(aspect.pointB))
    .slice(0, 2);

  if (!selected.length) return "";

  return "";
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

function normalizeSynastryData(data: SynastryData): SynastryData {
  return {
    compatibilityLabel: data.compatibilityLabel ? normalizeReadingText(data.compatibilityLabel) : undefined,
    compatibilityDescription: data.compatibilityDescription ? normalizeReadingText(data.compatibilityDescription) : undefined,
    layers: data.layers
      ? Object.fromEntries(Object.entries(data.layers).map(([key, value]) => [key, normalizeReadingText(value)]))
      : undefined,
  };
}

export function SynastryPage({ natalChart, dictionary, readingId, gender }: SynastryPageProps) {
  const locale = useStoredLocale();
  const synastryCopy = dictionary.result.synastryPage;
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(null);
  const [form, setForm] = useState<SynastryPartnerInput>({
    name: "",
    birthDate: "",
    birthTime: "12:00",
    birthCity: "",
    selectedLocation: null,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [synastryReading, setSynastryReading] = useState("");
  const [synastryData, setSynastryData] = useState<SynastryData>({});
  const [synastryReadingError, setSynastryReadingError] = useState<string | null>(null);
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<SynastryLayerId>("fisico");
  const [biWheelSelected, setBiWheelSelected] = useState<{ id: ChartPointId; ring: "inner" | "outer" } | null>(null);
  const [synastryWheelMode, setSynastryWheelMode] = useState<SynastryWheelMode>("all");
  const [natalHash, setNatalHash] = useState<string | null>(null);
  const [partnerHash, setPartnerHash] = useState<string | null>(null);
  const [partnersLoaded, setPartnersLoaded] = useState(false);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const partnerChart = selectedPartner?.chart_data ?? null;
  const innerChart = flipped && partnerChart ? partnerChart : natalChart;
  const outerChart = flipped && partnerChart ? natalChart : partnerChart;
  const innerName = flipped && selectedPartner ? selectedPartner.name : natalChart.event.name;
  const outerName = flipped && selectedPartner ? natalChart.event.name : selectedPartner?.name ?? "";
  const aspects = useMemo(
    () => outerChart ? calculateSynastryAspects(innerChart, outerChart) : [],
    [innerChart, outerChart],
  );
  const aspectedInnerIds = useMemo(() => [...new Set(aspects.map((aspect) => aspect.pointA))], [aspects]);
  const aspectedOuterIds = useMemo(() => [...new Set(aspects.map((aspect) => aspect.pointB))], [aspects]);
  const readingAspects = useMemo(
    () => partnerChart ? calculateSynastryAspects(natalChart, partnerChart) : [],
    [natalChart, partnerChart],
  );
  const hasAiCompatibility = Boolean(synastryData.compatibilityLabel && synastryData.compatibilityDescription);

  useEffect(() => {
    startTransition(async () => {
      const savedPartners = (await getSynastryPartnersAction()) as PartnerRow[];
      const storedPartner = readStoredPartner();
      setPartners(storedPartner && !savedPartners.some((partner) => partner.id === storedPartner.id)
        ? [storedPartner, ...savedPartners]
        : savedPartners);
      setPartnersLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (selectionHydrated || selectedPartner) return;
    const storedPartnerId = window.localStorage.getItem(SELECTED_PARTNER_STORAGE_KEY);
    const storedPartner = storedPartnerId
      ? partners.find((partner) => partner.id === storedPartnerId) ?? readStoredPartner()
      : readStoredPartner();
    if (!storedPartner && !partnersLoaded) return;
    if (storedPartner) {
      setPartners((current) => current.some((partner) => partner.id === storedPartner.id) ? current : [storedPartner, ...current]);
      setSelectedPartner(storedPartner);
    }
    setSelectionHydrated(true);
  }, [partners, partnersLoaded, selectedPartner, selectionHydrated]);

  useEffect(() => {
    let active = true;
    void hashNatalChart(natalChart).then((hash) => {
      if (active) setNatalHash(hash);
    });
    return () => {
      active = false;
    };
  }, [natalChart]);

  useEffect(() => {
    let active = true;
    setPartnerHash(null);
    if (!partnerChart) return;
    void hashNatalChart(partnerChart).then((hash) => {
      if (active) setPartnerHash(hash);
    });
    return () => {
      active = false;
    };
  }, [partnerChart]);

  useEffect(() => {
    setBiWheelSelected(null);
    if (!selectionHydrated) return;
    if (selectedPartner) {
      window.localStorage.setItem(SELECTED_PARTNER_STORAGE_KEY, selectedPartner.id);
      window.localStorage.setItem(SELECTED_PARTNER_DATA_STORAGE_KEY, JSON.stringify(selectedPartner));
    } else {
      window.localStorage.removeItem(SELECTED_PARTNER_STORAGE_KEY);
      window.localStorage.removeItem(SELECTED_PARTNER_DATA_STORAGE_KEY);
    }
  }, [selectedPartner, selectionHydrated]);

  useEffect(() => {
    setBiWheelSelected(null);
  }, [synastryWheelMode, flipped]);

  useEffect(() => {
    if (!selectedPartner || !partnerChart || readingAspects.length === 0 || !natalHash || !partnerHash) return;
    let active = true;
    const cacheKey = `synastry:${partnerHash}:${locale}:${gender || "unspecified"}`;
    const cachedData = getCachedPremiumReading<SynastryData>(natalHash, cacheKey);
    setSynastryReading("");
    setSynastryData({});
    setSynastryReadingError(null);
    if (cachedData) {
      setSynastryData(normalizeSynastryData(cachedData));
      setIsLoadingReading(false);
      return;
    }
    setIsLoadingReading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), READING_TIMEOUT_MS);
    void fetch("/api/synastry-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chartA: natalChart,
        chartB: partnerChart,
        partnerName: selectedPartner.name,
        aspects: readingAspects,
        locale,
        readingId,
        cacheKey,
        gender,
      }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!active || !res.ok || !res.body) {
        clearTimeout(timeout);
        if (active) {
          setSynastryReadingError(`Synastry reading failed: ${res.status}`);
          setIsLoadingReading(false);
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
        if (active) setSynastryReading(accumulated.split(SARITA_DATA_MARKER)[0] ?? accumulated);
      }
      if (active) {
        const rawPayload = accumulated.split(SARITA_DATA_MARKER)[1]?.trim() ?? "";
        const jsonPayload = cleanJsonPayload(rawPayload);
        if (jsonPayload) {
          try {
            const parsedData = normalizeSynastryData(JSON.parse(jsonPayload) as SynastryData);
            setSynastryData(parsedData);
            setCachedPremiumReading(natalHash, cacheKey, parsedData);
          } catch {
            setSynastryReadingError("Synastry reading JSON could not be parsed.");
            // JSON parse failed — synastryData stays empty until a valid payload arrives
          }
        } else {
          setSynastryReadingError("Synastry reading response did not include SARITA data.");
        }
        setIsLoadingReading(false);
      }
      clearTimeout(timeout);
    }).catch(() => {
      clearTimeout(timeout);
      if (active) {
        setSynastryReadingError("Synastry reading request failed or timed out.");
        setIsLoadingReading(false);
      }
    });
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [readingAspects, selectedPartner, partnerChart, natalChart, natalHash, partnerHash, locale, readingId, gender]);

  function savePartner() {
    setError(null);
    startTransition(async () => {
      const result = await saveAndCalculateSynastryPartnerAction(form);
      if (!result.ok) {
        if (result.chart) {
          const localPartner = localPartnerFromForm(form, result.chart);
          setPartners((current) => [localPartner, ...current]);
          setSelectedPartner(localPartner);
          setFlipped(false);
          setForm({ name: "", birthDate: "", birthTime: "12:00", birthCity: "", selectedLocation: null });
          return;
        }
        setError(result.error ?? synastryCopy.saveError);
        return;
      }
      const nextPartner = result.partner as PartnerRow;
      setPartners((current) => [nextPartner, ...current]);
      setSelectedPartner(nextPartner);
      setFlipped(false);
      setForm({ name: "", birthDate: "", birthTime: "12:00", birthCity: "", selectedLocation: null });
    });
  }

  if (selectedPartner && partnerChart) {
    const wheelOuterChart = outerChart ?? undefined;
    return (
      <section className="py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">{synastryCopy.eyebrow}</p>
          {synastryData.compatibilityLabel ? (
            <h2 className="mt-2 font-serif text-[30px] leading-tight text-ivory sm:text-[48px]">{synastryData.compatibilityLabel}</h2>
          ) : (
            <div className="mx-auto mt-4 h-10 w-72 animate-pulse rounded bg-black/8" />
          )}
        </div>
        <div className="mt-8">
          <WheelModeToggle
            mode={synastryWheelMode}
            onChange={setSynastryWheelMode}
            activeCount={aspectedInnerIds.length + aspectedOuterIds.length}
          />
          <BiWheelChart
            innerChart={innerChart}
            outerChart={wheelOuterChart}
            innerLabel={innerName}
            outerLabel={outerName}
            variant="synastry"
            innerPointIds={synastryWheelMode === "aspected" ? aspectedInnerIds : undefined}
            outerPointIds={synastryWheelMode === "aspected" ? aspectedOuterIds : undefined}
            onInnerPlanetSelect={(id) => setBiWheelSelected({ id, ring: "inner" })}
            onOuterPlanetSelect={(id) => setBiWheelSelected({ id, ring: "outer" })}
          />
          {biWheelSelected ? (
            <BiWheelInfoPanel
              variant="synastry"
              selectedId={biWheelSelected.id}
              ring={biWheelSelected.ring}
              innerChart={innerChart}
              outerChart={outerChart ?? null}
              synastryAspects={aspects}
              innerName={innerName}
              outerName={outerName}
              onClose={() => setBiWheelSelected(null)}
            />
          ) : null}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setFlipped((current) => !current)}
            className="border border-dusty-gold/30 bg-dusty-gold/[0.06] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24] transition hover:border-dusty-gold/55 hover:bg-dusty-gold/12"
          >
            {synastryCopy.flipCharts}
          </button>
        </div>
        <CompatibilityRing aspects={aspects} dictionary={dictionary} />
        <div className="mt-4 flex justify-center gap-6">
          {[
            { color: "bg-[rgba(130,146,214,0.88)]", label: synastryCopy.legendHarmonious },
            { color: "bg-[rgba(245,190,105,0.78)]", label: synastryCopy.legendTense },
            { color: "bg-[rgba(181,163,110,0.78)]", label: synastryCopy.legendNeutral },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-[12px] uppercase tracking-[0.16em] text-[#3a3048]">{label}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-5xl">
          <article className="border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              VÍNCULO
            </p>
            {isLoadingReading && !hasAiCompatibility ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-6 w-3/4 rounded bg-black/8" />
                <div className="h-3 w-full rounded bg-black/6" />
                <div className="h-3 w-5/6 rounded bg-black/6" />
              </div>
            ) : synastryReadingError && !hasAiCompatibility ? (
              <p className="mt-3 text-sm leading-7 text-red-700">{synastryReadingError}</p>
            ) : hasAiCompatibility ? (
              <>
                <h3 className="mt-2 font-serif text-[22px] leading-snug text-ivory">
                  {synastryData.compatibilityLabel}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#3a3048]">
                  {synastryData.compatibilityDescription}
                </p>
              </>
            ) : null}
          </article>
          <div className="mt-10">
            <div className="grid grid-cols-3 gap-2">
              {LAYERS.map((layer) => {
                const active = selectedLayerId === layer.id;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={[
                      "border py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                      active
                        ? "border-dusty-gold/60 bg-dusty-gold/[0.07] text-[#5c4a24]"
                        : "border-black/10 bg-white text-[#3a3048] hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    {synastryCopy.layerTitles[layer.id]}
                  </button>
                );
              })}
            </div>
            {(() => {
              const selectedLayer = LAYERS.find((layer) => layer.id === selectedLayerId) ?? LAYERS[0]!;
              const layerText = synastryData.layers?.[selectedLayer.id] ?? layerReading(aspects, selectedLayer, dictionary);
              const { headline, body } = splitReading(layerText);

              return (
                <article className="mt-4 min-h-[160px] border border-black/10 bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                    {synastryCopy.layerTitles[selectedLayer.id].toUpperCase()}
                  </p>
                  {isLoadingReading && !layerText ? (
                    <div className="mt-3 animate-pulse space-y-2">
                      <div className="h-6 w-3/4 rounded bg-black/8" />
                      <div className="h-3 w-full rounded bg-black/6" />
                      <div className="h-3 w-5/6 rounded bg-black/6" />
                    </div>
                  ) : synastryReadingError && !layerText ? (
                    <p className="mt-3 text-sm leading-7 text-red-700">{synastryReadingError}</p>
                  ) : (
                    <>
                      {headline ? (
                        <h3 className="mt-2 font-serif text-[24px] leading-snug text-ivory">
                          {headline}
                        </h3>
                      ) : null}
                      {body ? <p className="mt-3 text-sm leading-7 text-[#3a3048]">{body}</p> : null}
                    </>
                  )}
                </article>
              );
            })()}
          </div>
          <PrimaryButton
            type="button"
            variant="ghostGold"
            className="mt-6 px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
            onClick={() => setSelectedPartner(null)}
          >
            {synastryCopy.compareAnother}
          </PrimaryButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl py-16">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-sm leading-7 text-[#3a3048]">
          {synastryCopy.intro}
        </p>
      </div>
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">{synastryCopy.eyebrow}</p>
      <h2 className="mt-2 font-serif text-[34px] leading-tight text-ivory sm:text-[52px]">{synastryCopy.title}</h2>
      {partners.length ? (
        <div className="mt-8 border-y border-black/10">
          {partners.map((partner) => (
            <div key={partner.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 py-4 last:border-b-0">
              <div>
                <p className="font-serif text-xl text-ivory">{partner.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[#3a3048]">{partner.birth_date} · {partner.birth_city}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="border border-black/20 bg-transparent px-4 py-2 text-xs uppercase tracking-[0.18em] text-ivory transition hover:bg-black/[0.05]" onClick={() => { setSelectedPartner(partner); setFlipped(false); }}>{synastryCopy.compare}</button>
                <button
                  type="button"
                  className="border border-black/20 bg-transparent px-4 py-2 text-xs uppercase tracking-[0.18em] text-ivory transition hover:bg-black/[0.05]"
                  onClick={() => {
                    startTransition(async () => {
                      if (!partner.id.startsWith("local-")) {
                        await deleteSynastryPartnerAction(partner.id);
                      }
                      setPartners((current) => current.filter((entry) => entry.id !== partner.id));
                    });
                  }}
                >
                  {synastryCopy.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-5 border-t border-dusty-gold/14 pt-8">
        <p className="font-serif text-2xl text-ivory">{synastryCopy.addPerson}</p>
        <input className="rounded-2xl border border-black/15 bg-cosmic-900 px-4 py-4 text-sm text-ivory outline-none transition placeholder:text-muted-ivory hover:border-black/25" placeholder={dictionary.form.fields.name} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <input className="rounded-2xl border border-black/15 bg-cosmic-900 px-4 py-4 text-sm text-ivory outline-none transition placeholder:text-muted-ivory hover:border-black/25" type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: clampIsoDateYear(event.target.value) }))} />
        <input className="rounded-2xl border border-black/15 bg-cosmic-900 px-4 py-4 text-sm text-ivory outline-none transition placeholder:text-muted-ivory hover:border-black/25" type="time" value={form.birthTime} onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))} />
        <LocationAutocomplete
          value={form.birthCity}
          selectedLocation={form.selectedLocation}
          onInputChange={(value) => setForm((current) => ({ ...current, birthCity: value, selectedLocation: current.selectedLocation?.displayName === value ? current.selectedLocation : null }))}
          onSelect={(place: PlaceSuggestion) => setForm((current) => ({ ...current, birthCity: place.displayName, selectedLocation: place }))}
          dictionary={dictionary}
        />
        {error ? <p className="text-sm text-amber-100/80">{error}</p> : null}
        <PrimaryButton type="button" onClick={savePartner} disabled={isPending || !form.name || !form.birthDate || !form.birthCity}>
          {isPending ? synastryCopy.saving : synastryCopy.saveAndCompare}
        </PrimaryButton>
      </div>
    </section>
  );
}
