"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
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
import { clampIsoDateYear } from "@/lib/date-input";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { calculateSynastryAspects, compatibilityLabel, type SynastryAspect } from "@/lib/synastry";

type SynastryPageProps = {
  natalChart: NatalChartData;
  dictionary: Dictionary;
};

type SynastryData = {
  compatibilityLabel?: string;
  compatibilityDescription?: string;
  layers?: Record<string, string>;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";

type PartnerRow = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_city: string;
  chart_data: NatalChartData | null;
};

const ASPECT_SYMBOLS = {
  conjunction: "☌",
  opposition: "☍",
  trine: "△",
  square: "□",
  sextile: "✶",
  quincunx: "⚻",
} as const;

type SynastryLayerId = "fisico" | "sexual" | "emocional" | "mental" | "profesional" | "evolutivo";

const LAYERS: Array<{
  id: SynastryLayerId;
  title: string;
  points: ChartPointId[];
  empty: string;
}> = [
  { id: "fisico", title: "Físico", points: ["venus", "mars", "sun", "moon"], empty: "No hay una firma física dominante por aspectos cerrados. La atracción puede existir, pero no es el centro técnico de esta comparación." },
  { id: "sexual", title: "Sexual", points: ["venus", "mars", "pluto", "moon"], empty: "No aparece una activación sexual fuerte en los aspectos principales. Eso no niega deseo: solo indica que no es la capa astrológica más insistente." },
  { id: "emocional", title: "Emocional", points: ["moon", "venus", "neptune"], empty: "La capa emocional no está especialmente marcada por aspectos cerrados. Conviene leerla desde la comunicación real y el cuidado cotidiano." },
  { id: "mental", title: "Mental", points: ["mercury", "jupiter", "uranus"], empty: "La conexión mental no domina la carta comparada. Puede haber conversación, pero el vínculo se activa más por otras vías." },
  { id: "profesional", title: "Profesional", points: ["sun", "mercury", "jupiter", "saturn", "mars"], empty: "No se ve una dinámica profesional especialmente fuerte en los aspectos principales. Si trabajan juntos, habría que cuidar estructura y expectativas fuera de la carta." },
  { id: "evolutivo", title: "Evolutivo", points: ["northNode", "saturn", "pluto", "uranus", "neptune"], empty: "No hay una firma evolutiva dominante por aspectos cerrados. El vínculo puede enseñar, pero no parece empujar desde una presión kármica principal." },
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

function CompatibilityRing({ aspects }: { aspects: SynastryAspect[] }) {
  const breakdown = qualityBreakdown(aspects);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const harmoniousLength = (breakdown.harmonious / 100) * circumference;
  const tenseLength = (breakdown.tense / 100) * circumference;
  const neutralLength = Math.max(0, circumference - harmoniousLength - tenseLength);

  return (
    <svg viewBox="0 0 170 170" className="mx-auto h-40 w-40" role="img" aria-label="Dinámica de compatibilidad">
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(130,146,214,0.88)" strokeWidth="16" strokeDasharray={`${harmoniousLength} ${circumference}`} transform="rotate(-90 85 85)" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(245,190,105,0.78)" strokeWidth="16" strokeDasharray={`${tenseLength} ${circumference}`} strokeDashoffset={-harmoniousLength} transform="rotate(-90 85 85)" />
      <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(181,163,110,0.78)" strokeWidth="16" strokeDasharray={`${neutralLength} ${circumference}`} strokeDashoffset={-(harmoniousLength + tenseLength)} transform="rotate(-90 85 85)" />
      <text x="85" y="80" textAnchor="middle" className="font-serif text-[22px]" fill="rgba(255,255,255,0.86)">{aspects.length}</text>
      <text x="85" y="101" textAnchor="middle" className="text-[10px] uppercase tracking-[0.16em]" fill="rgba(255,255,255,0.42)">aspectos</text>
    </svg>
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

function pointLabel(id: ChartPointId, dictionary: Dictionary) {
  return dictionary.result.points[id] ?? id;
}

function aspectsForLayer(aspects: SynastryAspect[], layer: (typeof LAYERS)[number]) {
  const layerPoints = new Set(layer.points);
  return aspects.filter((aspect) => layerPoints.has(aspect.pointA) || layerPoints.has(aspect.pointB)).slice(0, 4);
}

function hasPoint(aspects: SynastryAspect[], point: ChartPointId) {
  return aspects.some((aspect) => aspect.pointA === point || aspect.pointB === point);
}

function hasTense(aspects: SynastryAspect[]) {
  return aspects.some((aspect) => aspect.quality === "tense");
}

function hasHarmony(aspects: SynastryAspect[]) {
  return aspects.some((aspect) => aspect.quality === "harmonious");
}

function layerReading(
  aspects: SynastryAspect[],
  layer: (typeof LAYERS)[number],
  innerName: string,
  outerName: string,
) {
  const selected = aspectsForLayer(aspects, layer);
  if (!selected.length) return layer.empty;

  const harmonious = hasHarmony(selected);
  const tense = hasTense(selected);
  const intensity = selected.length >= 3 ? "muy marcada" : "presente";

  if (layer.id === "fisico") {
    const body = hasPoint(selected, "mars")
      ? "hay reacción corporal rápida: se activan, se provocan y se mueven mutuamente"
      : "el contacto se percibe más por comodidad, presencia y familiaridad que por impulso directo";
    return `En lo físico, ${innerName} y ${outerName} tienen una conexión ${intensity}. ${body}. ${tense ? "Puede sentirse estimulante, pero también impaciente: el cuerpo responde antes de que la mente entienda." : "La sensación tiende a ser fácil de habitar, como si el cuerpo reconociera un ritmo compartido."}`;
  }

  if (layer.id === "sexual") {
    const pluto = hasPoint(selected, "pluto");
    const mars = hasPoint(selected, "mars");
    return `En lo sexual, la carta habla de ${pluto ? "magnetismo profundo, deseo que toca sombra y una atracción difícil de dejar en superficie" : mars ? "chispa, iniciativa y deseo que necesita movimiento" : "sensualidad más suave, que crece cuando hay confianza"}. ${tense ? "La intensidad puede mezclar deseo con pulso de poder, celos o necesidad de control si no se habla claro." : "Cuando hay cuidado, esta capa puede sentirse nutritiva y naturalmente atractiva."}`;
  }

  if (layer.id === "emocional") {
    const moon = hasPoint(selected, "moon");
    return `En lo emocional, ${moon ? "se tocan zonas sensibles y necesidades de apego: no es una relación neutra para el sistema nervioso" : "la emoción aparece como clima de fondo más que como tema principal"}. ${harmonious ? "Hay capacidad de ternura, reparación y escucha si ambos bajan la defensa." : "La carta pide aprender a no reaccionar desde la herida: lo que uno siente puede despertar defensas en el otro."}`;
  }

  if (layer.id === "mental") {
    const uranus = hasPoint(selected, "uranus");
    return `En lo mental, la relación ${uranus ? "despierta ideas, cambios de perspectiva y conversaciones que pueden romper esquemas" : "se activa por la palabra, las creencias y la forma de interpretar lo que sucede"}. ${tense ? "El reto es no convertir cada diferencia en debate o juicio." : "Cuando se escuchan de verdad, pueden ayudarse a ordenar pensamientos y abrir posibilidades."}`;
  }

  if (layer.id === "profesional") {
    const saturn = hasPoint(selected, "saturn");
    const jupiter = hasPoint(selected, "jupiter");
    return `En lo profesional, esta combinación muestra ${saturn ? "capacidad para construir con disciplina, aunque también puede traer exigencia, presión o sensación de evaluación" : jupiter ? "crecimiento, visión y posibilidad de abrir puertas juntos" : "activación de objetivos, iniciativa y dirección compartida"}. ${tense ? "Para que funcione, conviene pactar roles, tiempos y expectativas desde el principio." : "Puede ser una alianza fértil si mantienen foco y una estructura simple."}`;
  }

  return `En lo evolutivo, el vínculo no aparece solo para estar cómodos: mueve decisiones y patrones importantes. ${hasPoint(selected, "northNode") ? "Hay sensación de camino, aprendizaje o destino compartido, como si una persona empujara a la otra hacia una versión más despierta de sí misma." : "La transformación llega por contraste: el otro muestra partes que estaban dormidas, idealizadas o resistidas."} ${tense ? "No siempre se siente fácil, pero si se trabaja con honestidad puede volverse profundamente revelador." : "La evolución aquí puede sentirse inspiradora, menos forzada y más natural."}`;
}

export function SynastryPage({ natalChart, dictionary }: SynastryPageProps) {
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
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const partnerChart = selectedPartner?.chart_data ?? null;
  const innerChart = flipped && partnerChart ? partnerChart : natalChart;
  const outerChart = flipped && partnerChart ? natalChart : partnerChart;
  const innerName = flipped && selectedPartner ? selectedPartner.name : natalChart.event.name;
  const outerName = flipped && selectedPartner ? natalChart.event.name : selectedPartner?.name ?? "";
  const aspects = useMemo(
    () => outerChart ? calculateSynastryAspects(innerChart, outerChart) : [],
    [innerChart, outerChart],
  );
  const label = compatibilityLabel(aspects, locale);

  useEffect(() => {
    startTransition(async () => {
      setPartners((await getSynastryPartnersAction()) as PartnerRow[]);
    });
  }, []);

  useEffect(() => {
    if (!selectedPartner || !partnerChart || aspects.length === 0) return;
    let active = true;
    setSynastryReading("");
    setSynastryData({});
    setIsLoadingReading(true);
    void fetch("/api/synastry-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chartA: natalChart,
        chartB: partnerChart,
        partnerName: selectedPartner.name,
        aspects,
        locale,
      }),
    }).then(async (res) => {
      if (!active || !res.ok || !res.body) { if (active) setIsLoadingReading(false); return; }
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
        const jsonPayload = accumulated.split(SARITA_DATA_MARKER)[1]?.trim();
        if (jsonPayload) {
          try {
            setSynastryData(JSON.parse(jsonPayload) as SynastryData);
          } catch {}
        }
        setIsLoadingReading(false);
      }
    }).catch(() => { if (active) setIsLoadingReading(false); });
    return () => { active = false; };
  }, [aspects, selectedPartner, partnerChart, natalChart, locale]);

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
        setError(result.error ?? "No se pudo guardar la persona.");
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
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">{synastryCopy.eyebrow}</p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight text-ivory sm:text-[48px]">{synastryData.compatibilityLabel ?? label.label}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ivory/62">{synastryData.compatibilityDescription ?? label.description}</p>
        </div>
        <div className="mt-8">
          <BiWheelChart
            innerChart={innerChart}
            outerChart={wheelOuterChart}
            innerLabel={innerName}
            outerLabel={outerName}
            variant="synastry"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setFlipped((current) => !current)}
            className="border border-[#8292d6]/30 bg-[#8292d6]/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b8c2ff] transition hover:border-[#8292d6]/55 hover:bg-[#8292d6]/16"
          >
            {synastryCopy.flipCharts}
          </button>
        </div>
        <CompatibilityRing aspects={aspects} />
        {(isLoadingReading || synastryReading) ? (
          <div className="mx-auto mt-6 max-w-3xl border-y border-[#8292d6]/18 py-6">
            <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[#8292d6]/60">{synastryCopy.readingEyebrow}</p>
            {isLoadingReading && !synastryReading ? (
              <p className="mt-4 animate-pulse text-base leading-8 text-ivory/35">{synastryCopy.readingLoading}</p>
            ) : (
              synastryReading.split(SARITA_DATA_MARKER)[0].split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i} className="mt-4 text-base leading-8 text-ivory/82">{para}</p>
              ))
            )}
          </div>
        ) : null}
        <div className="mx-auto mt-8 max-w-3xl border-y border-white/10 py-6">
          <p className="font-serif text-2xl text-ivory">{synastryCopy.mainConnections}</p>
          <div className="mt-4 space-y-3">
            {aspects.slice(0, 6).map((aspect) => (
              <p key={`${aspect.pointA}-${aspect.pointB}-${aspect.type}`} className="text-sm leading-7 text-ivory/64">
                <span className="text-dusty-gold/82">{pointLabel(aspect.pointA, dictionary)}</span>{" "}
                {ASPECT_SYMBOLS[aspect.type]}{" "}
                <span className="text-[#8292d6]">{pointLabel(aspect.pointB, dictionary)}</span> · {synastryCopy.aspectQuality[aspect.quality]} · {synastryCopy.orb} {aspect.orb}°.
              </p>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {LAYERS.map((layer) => (
              <details key={layer.id} className="border border-white/10 bg-white/[0.025] p-4">
                <summary className="cursor-pointer font-serif text-lg text-ivory">{synastryCopy.layerTitles[layer.id]}</summary>
                <p className="mt-3 text-sm leading-7 text-ivory/58">
                  {synastryData.layers?.[layer.id] ?? layerReading(aspects, layer, innerName, outerName)}
                </p>
              </details>
            ))}
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
        <p className="text-sm leading-7 text-ivory/60">
          {synastryCopy.intro}
        </p>
      </div>
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">{synastryCopy.eyebrow}</p>
      <h2 className="mt-2 font-serif text-[34px] leading-tight text-ivory sm:text-[52px]">{synastryCopy.title}</h2>
      {partners.length ? (
        <div className="mt-8 border-y border-white/10">
          {partners.map((partner) => (
            <div key={partner.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 py-4 last:border-b-0">
              <div>
                <p className="font-serif text-xl text-ivory">{partner.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-ivory/38">{partner.birth_date} · {partner.birth_city}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="border border-dusty-gold/28 px-4 py-2 text-xs uppercase tracking-[0.18em] text-dusty-gold/82" onClick={() => { setSelectedPartner(partner); setFlipped(false); }}>{synastryCopy.compare}</button>
                <button
                  type="button"
                  className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-ivory/42"
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
        <input className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none" placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <input className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none" type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: clampIsoDateYear(event.target.value) }))} />
        <input className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none" type="time" value={form.birthTime} onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))} />
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
