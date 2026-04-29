"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  deleteSynastryPartnerAction,
  getSynastryPartnersAction,
  saveAndCalculateSynastryPartnerAction,
  type SynastryPartnerInput,
} from "@/lib/actions";
import type { NatalChartData } from "@/lib/chart";
import { clampIsoDateYear } from "@/lib/date-input";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { calculateSynastryAspects, compatibilityLabel, type SynastryAspect } from "@/lib/synastry";

type SynastryPageProps = {
  natalChart: NatalChartData;
  dictionary: Dictionary;
};

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

export function SynastryPage({ natalChart, dictionary }: SynastryPageProps) {
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
  const partnerChart = selectedPartner?.chart_data ?? null;
  const aspects = useMemo(
    () => partnerChart ? calculateSynastryAspects(natalChart, partnerChart) : [],
    [natalChart, partnerChart],
  );
  const label = compatibilityLabel(aspects);

  useEffect(() => {
    startTransition(async () => {
      setPartners((await getSynastryPartnersAction()) as PartnerRow[]);
    });
  }, []);

  function savePartner() {
    setError(null);
    startTransition(async () => {
      const result = await saveAndCalculateSynastryPartnerAction(form);
      if (!result.ok) {
        if (result.chart) {
          const localPartner = localPartnerFromForm(form, result.chart);
          setPartners((current) => [localPartner, ...current]);
          setSelectedPartner(localPartner);
          setForm({ name: "", birthDate: "", birthTime: "12:00", birthCity: "", selectedLocation: null });
          return;
        }
        setError(result.error ?? "No se pudo guardar la persona.");
        return;
      }
      const nextPartner = result.partner as PartnerRow;
      setPartners((current) => [nextPartner, ...current]);
      setSelectedPartner(nextPartner);
      setForm({ name: "", birthDate: "", birthTime: "12:00", birthCity: "", selectedLocation: null });
    });
  }

  if (selectedPartner && partnerChart) {
    return (
      <section className="py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">sinastría</p>
          <h2 className="mt-2 font-serif text-[48px] leading-tight text-ivory">{label.label}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ivory/62">{label.description}</p>
        </div>
        <div className="mt-8">
          <BiWheelChart
            innerChart={natalChart}
            outerChart={partnerChart}
            innerLabel={natalChart.event.name}
            outerLabel={selectedPartner.name}
            variant="synastry"
          />
        </div>
        <CompatibilityRing aspects={aspects} />
        <div className="mx-auto mt-8 max-w-3xl border-y border-white/10 py-6">
          <p className="font-serif text-2xl text-ivory">Conexiones principales</p>
          <div className="mt-4 space-y-3">
            {aspects.slice(0, 6).map((aspect) => (
              <p key={`${aspect.pointA}-${aspect.pointB}-${aspect.type}`} className="text-sm leading-7 text-ivory/64">
                <span className="text-dusty-gold/82">{aspect.pointA}</span>{" "}
                {ASPECT_SYMBOLS[aspect.type]}{" "}
                <span className="text-[#8292d6]">{aspect.pointB}</span> · {aspect.quality} · orbe {aspect.orb}°.
              </p>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {["Físico", "Emocional", "Mental", "Evolutivo"].map((level) => (
              <details key={level} className="border border-white/10 bg-white/[0.025] p-4">
                <summary className="cursor-pointer font-serif text-lg text-ivory">{level}</summary>
                <p className="mt-3 text-sm leading-7 text-ivory/58">
                  Esta capa se lee a través de los inter-aspectos más cercanos. No define el vínculo: muestra dónde se activa.
                </p>
              </details>
            ))}
          </div>
          <PrimaryButton
            type="button"
            variant="ghostGold"
            className="mt-6 px-5 py-3 text-[0.68rem] uppercase tracking-[0.2em]"
            onClick={() => setSelectedPartner(null)}
          >
            Comparar con otra persona
          </PrimaryButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl py-16">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">sinastría</p>
      <h2 className="mt-2 font-serif text-[52px] leading-tight text-ivory">Dos cartas, un campo.</h2>
      {partners.length ? (
        <div className="mt-8 border-y border-white/10">
          {partners.map((partner) => (
            <div key={partner.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 py-4 last:border-b-0">
              <div>
                <p className="font-serif text-xl text-ivory">{partner.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-ivory/38">{partner.birth_date} · {partner.birth_city}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="border border-dusty-gold/28 px-4 py-2 text-xs uppercase tracking-[0.18em] text-dusty-gold/82" onClick={() => setSelectedPartner(partner)}>Comparar</button>
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
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-5 border-t border-dusty-gold/14 pt-8">
        <p className="font-serif text-2xl text-ivory">Añadir persona nueva</p>
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
          {isPending ? "Guardando..." : "Guardar y comparar"}
        </PrimaryButton>
      </div>
    </section>
  );
}
