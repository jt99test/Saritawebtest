"use client";

import { useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { PrimaryButton } from "@/components/ui/primary-button";
import { calculateSolarReturnAction } from "@/lib/actions";
import type { NatalChartData } from "@/lib/chart";
import { formatSignPosition } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";

type SolarReturnPageProps = {
  natalChart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
};

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad y cuerpo",
  2: "recursos y valor propio",
  3: "voz, mente y entorno",
  4: "hogar y raíz emocional",
  5: "creatividad y deseo",
  6: "rutina, salud y oficio",
  7: "vínculos y acuerdos",
  8: "intimidad y transformación",
  9: "sentido, viajes y expansión",
  10: "dirección pública",
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

function topSolarAspects(natalChart: NatalChartData, solarChart: NatalChartData) {
  const aspectAngles = [
    { label: "conjunción", angle: 0, orb: 6 },
    { label: "oposición", angle: 180, orb: 6 },
    { label: "cuadratura", angle: 90, orb: 5 },
  ];
  const natalPoints = natalChart.points.filter((point) => ["sun", "moon", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].includes(point.id));
  const solarPoints = solarChart.points.filter((point) => ["sun", "moon", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].includes(point.id));

  return solarPoints.flatMap((solar) =>
    natalPoints.flatMap((natal) => {
      const distance = Math.abs(solar.longitude - natal.longitude);
      const angle = distance > 180 ? 360 - distance : distance;
      const match = aspectAngles.find((aspect) => Math.abs(angle - aspect.angle) <= aspect.orb);
      return match
        ? [{
            id: `${solar.id}-${natal.id}-${match.label}`,
            text: `${solar.glyph} ${match.label} ${natal.glyph}`,
            orb: Math.round(Math.abs(angle - match.angle) * 10) / 10,
          }]
        : [];
    }),
  ).sort((left, right) => left.orb - right.orb).slice(0, 5);
}

export function SolarReturnPage({ natalChart, request, dictionary }: SolarReturnPageProps) {
  const defaultYear = currentSolarReturnYear(request);
  const [targetYear, setTargetYear] = useState(defaultYear);
  const [city, setCity] = useState(request?.selectedLocation?.displayName ?? natalChart.event.locationLabel);
  const [selectedLocation, setSelectedLocation] = useState<PlaceSuggestion | null>(request?.selectedLocation ?? null);
  const [solarChart, setSolarChart] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => defaultYear - 5 + index),
    [defaultYear],
  );
  const aspects = solarChart ? topSolarAspects(natalChart, solarChart) : [];
  const rsAscendantSign = solarChart ? dictionary.result.signs[formatSignPosition(solarChart.meta.ascendant).sign] : "";
  const rsMoon = solarChart?.points.find((point) => point.id === "moon");
  const rsSun = solarChart?.points.find((point) => point.id === "sun");

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
      } else {
        setError(result.error ?? "No se pudo calcular la Revolución Solar.");
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
        />

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            ["El tema del año", `Ascendente ${rsAscendantSign}. La forma de entrar al año marca el tono de toda la experiencia.`],
            ["El área de vida", `Sol en casa ${rsSun?.house ?? "—"}: ${HOUSE_AREAS[rsSun?.house ?? 1]}. Ahí se concentra el foco vital.`],
            ["El tono emocional", `Luna en ${rsMoon ? dictionary.result.signs[rsMoon.sign] : "—"}. El cuerpo emocional pide ser escuchado desde ese clima.`],
          ].map(([title, body]) => (
            <article key={title} className="border-t border-dusty-gold/16 bg-white/[0.02] p-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-dusty-gold/60">{title}</p>
              <p className="mt-3 text-sm leading-7 text-ivory/68">{body}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl border-y border-white/10 py-6">
          <p className="font-serif text-2xl text-ivory">Aspectos clave del año</p>
          <div className="mt-4 space-y-3">
            {aspects.map((aspect) => (
              <p key={aspect.id} className="text-sm leading-7 text-ivory/64">
                <span className="text-dusty-gold/80">{aspect.text}</span> · orbe {aspect.orb}°. Una zona natal se activa con fuerza y pide respuesta consciente.
              </p>
            ))}
          </div>
          <PrimaryButton
            type="button"
            variant="ghostGold"
            className="mt-6 px-5 py-3 text-[0.68rem] uppercase tracking-[0.2em]"
            onClick={() => setSolarChart(null)}
          >
            Ver otro año
          </PrimaryButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl py-16">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        revolución solar
      </p>
      <h2 className="mt-2 font-serif text-[52px] leading-tight text-ivory">El mapa de tu año.</h2>
      <div className="mt-8 grid gap-5">
        <label className="block">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ivory/44">Año</span>
          <select
            value={targetYear}
            onChange={(event) => setTargetYear(Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none focus:border-dusty-gold/55"
          >
            {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <div>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ivory/44">
            ¿En qué ciudad pasarás tu cumpleaños?
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
          <p className="mt-2 text-xs leading-5 text-ivory/42">La ciudad importa: cambia el Ascendente del año.</p>
        </div>
        {error ? <p className="text-sm text-amber-100/80">{error}</p> : null}
        <PrimaryButton type="button" onClick={calculate} disabled={isPending}>
          {isPending ? "Calculando..." : `Ver mi año ${targetYear}`}
        </PrimaryButton>
      </div>
    </section>
  );
}
