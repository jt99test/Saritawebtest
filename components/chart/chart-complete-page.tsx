"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { calculateCurrentTransitsAction } from "@/lib/actions";
import type { ChartPoint, ChartPointId, NatalChartData } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";
import type { Dictionary } from "@/lib/i18n";
import type { ActiveTransit } from "@/lib/transits.server";

type ChartCompletePageProps = {
  chart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
};

type TransitResult = Awaited<ReturnType<typeof calculateCurrentTransitsAction>>;
type TransitData = {
  dominantTitle?: string;
  dominantBody?: string;
  planetLanguage?: string;
  houses?: Array<{ house: number; title: string; body: string }>;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";

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

const PLANET_LANGUAGE: Partial<Record<ChartPointId, string>> = {
  saturn: "Saturno pide estructura, límites y madurez. No empuja rápido: obliga a elegir qué sostener de verdad.",
  jupiter: "Júpiter amplía el campo. Muestra dónde hay crecimiento, confianza y una puerta que se abre si te atreves a ocupar más espacio.",
  uranus: "Urano despierta lo que estaba dormido. Trae cambio, independencia y una necesidad de romper una forma vieja.",
  neptune: "Neptuno sensibiliza y disuelve. Pide escuchar lo invisible, pero también cuidar las fantasías que nublan la decisión.",
  pluto: "Plutón intensifica. Va a la raíz de un patrón y empuja una transformación profunda, no superficial.",
  mars: "Marte activa deseo, impulso y fricción. Muestra dónde necesitas actuar, defenderte o mover energía estancada.",
  venus: "Venus abre preguntas de valor, vínculo y placer. Señala dónde algo necesita más belleza, reciprocidad o cuidado.",
};

function pointLabel(id: ChartPointId) {
  return POINT_LABELS[id] ?? id;
}

function findPoint(chart: NatalChartData, id: ChartPointId) {
  return chart.points.find((point) => point.id === id) ?? chart.extendedPoints?.find((point) => point.id === id);
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
  return (planetWeight[transit.transitingPlanet] ?? 1) + aspectWeight[transit.aspectType] + tightness - transit.orb;
}

function topTransits(transits: ActiveTransit[]) {
  return [...transits].sort((a, b) => transitWeight(b) - transitWeight(a)).slice(0, 6);
}

function activatedHouses(chart: NatalChartData, transits: ActiveTransit[]) {
  const byHouse = new Map<number, { house: number; count: number; points: Set<string>; transits: ActiveTransit[] }>();

  topTransits(transits).forEach((transit) => {
    const natalPoint = findPoint(chart, transit.natalPlanet);
    if (!natalPoint) return;
    const current = byHouse.get(natalPoint.house) ?? {
      house: natalPoint.house,
      count: 0,
      points: new Set<string>(),
      transits: [],
    };
    current.count += 1;
    current.points.add(pointLabel(natalPoint.id));
    current.transits.push(transit);
    byHouse.set(natalPoint.house, current);
  });

  return [...byHouse.values()].sort((a, b) => b.count - a.count).slice(0, 3);
}

function transitSentence(chart: NatalChartData, transit: ActiveTransit) {
  const natalPoint = findPoint(chart, transit.natalPlanet);
  const house = natalPoint?.house;
  const area = house ? HOUSE_AREAS[house] : "una zona sensible de tu carta";
  const aspect = ASPECT_LABELS[transit.aspectType];

  return `${pointLabel(transit.transitingPlanet)} ${aspect} tu ${pointLabel(transit.natalPlanet)} natal: activa ${area}.`;
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

export function ChartCompletePage({ chart, request, dictionary }: ChartCompletePageProps) {
  const locale = useStoredLocale();
  const transitCopy = dictionary.result.transitPage;
  const [result, setResult] = useState<TransitResult | null>(null);
  const [transitReading, setTransitReading] = useState("");
  const [transitData, setTransitData] = useState<TransitData>({});
  const [isLoadingTransitReading, setIsLoadingTransitReading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      const next = await calculateCurrentTransitsAction(chart, request);
      if (active) setResult(next);
    });
    return () => {
      active = false;
    };
  }, [chart, request]);

  useEffect(() => {
    if (!result?.ok || result.transits.length === 0) return;
    let active = true;
    const top = topTransits(result.transits).map(t => ({
      transitingPlanet: t.transitingPlanet,
      natalPlanet: t.natalPlanet,
      aspectType: t.aspectType,
      orb: t.orb,
      strength: t.strength,
      natalHouse: findPoint(chart, t.natalPlanet)?.house,
    }));
    setTransitReading("");
    setTransitData({});
    setIsLoadingTransitReading(true);
    void fetch("/api/transit-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, transits: top, locale }),
    }).then(async (res) => {
      if (!active || !res.ok || !res.body) { if (active) setIsLoadingTransitReading(false); return; }
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
          try {
            setTransitData(JSON.parse(accumulated.slice(markerIdx + SARITA_DATA_MARKER.length).trim()) as TransitData);
          } catch {}
        }
        setIsLoadingTransitReading(false);
      }
    }).catch(() => { if (active) setIsLoadingTransitReading(false); });
    return () => { active = false; };
  }, [result, chart, locale]);

  const activeTransits = useMemo(() => {
    if (!result?.ok) return [];
    return topTransits(result.transits);
  }, [result]);

  const houses = useMemo(() => activatedHouses(chart, activeTransits), [chart, activeTransits]);
  const dominantTransit = activeTransits[0];
  const proseTransitReading = transitReading.split(SARITA_DATA_MARKER)[0] ?? transitReading;
  const waitingForTransitData = isLoadingTransitReading && !transitData.dominantTitle;

  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#6f613a]">
          {transitCopy.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[42px] leading-tight text-ivory md:text-[56px]">
          {transitCopy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#3a3048]">
          {transitCopy.description}
        </p>
        {result?.ok ? (
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6f613a]">
            {transitCopy.calculatedAt} {dateLabel(result.generatedAt, locale)}
          </p>
        ) : null}
      </div>

      <div className="mt-10">
        {result?.ok ? (
          <BiWheelChart
            innerChart={chart}
            outerChart={result.chart}
            innerLabel={chart.event.name}
            outerLabel={dictionary.result.primaryTabs.complete}
            variant="synastry"
          />
        ) : (
          <div className="mx-auto flex min-h-[420px] max-w-[860px] items-center justify-center border border-black/10 bg-white text-center shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
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

      <div className="mx-auto mt-10 max-w-5xl border-t border-black/[0.07]" />

      {dominantTransit ? (
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-[1.05fr_0.95fr]">
          <article className="border border-black/12 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#6f613a]">
              {transitCopy.mostActiveEyebrow}
            </p>
            <h3 className="mt-3 font-serif text-3xl leading-tight text-ivory">
              {transitData.dominantTitle ?? (waitingForTransitData ? "..." : `${pointLabel(dominantTransit.transitingPlanet)} está activando tu ${pointLabel(dominantTransit.natalPlanet)}`)}
            </h3>
            <p className="mt-4 text-base leading-8 text-[#3a3048]">
              {transitData.dominantBody ?? (waitingForTransitData ? <span className="animate-pulse text-[#3a3048]">Generando...</span> : `${transitSentence(chart, dominantTransit)} Este tránsito no describe un destino cerrado: muestra el lenguaje evolutivo del momento, la parte de ti que está siendo llamada a responder con más conciencia.`)}
            </p>
          </article>

          <article className="border border-black/12 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#6f613a]">
              {transitCopy.planetLanguageEyebrow}
            </p>
            <p className="mt-4 text-base leading-8 text-[#3a3048]">
              {transitData.planetLanguage ?? (waitingForTransitData ? <span className="animate-pulse text-[#3a3048]">Generando...</span> : PLANET_LANGUAGE[dominantTransit.transitingPlanet] ?? "Este planeta marca una zona de aprendizaje activo y pide presencia.")}
            </p>
            <p className="mt-5 text-sm leading-7 text-[#3a3048]">
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

      <div className="mx-auto mt-10 max-w-5xl border-t border-black/[0.07]" />

      {(isLoadingTransitReading || transitReading) ? (
        <div className="mx-auto mt-8 max-w-3xl border-y border-dusty-gold/14 py-7">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#6f613a]">{transitCopy.readingEyebrow}</p>
          {isLoadingTransitReading && !transitReading ? (
            <p className="mt-4 animate-pulse text-base leading-8 text-[#3a3048]">{transitCopy.readingLoading}</p>
          ) : (
            proseTransitReading.split("\n\n").filter(Boolean).map((para, i) => (
              <p key={i} className="mt-4 text-base leading-8 text-[#2f293b]">{para}</p>
            ))
          )}
        </div>
      ) : null}

      <div className="mx-auto mt-10 max-w-5xl border-t border-black/[0.07]" />

      {activeTransits.length > 0 ? (
        <div className="mx-auto mt-10 max-w-5xl border-t border-black/10 pt-8">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#6f613a]">
            {transitCopy.activatedAreasEyebrow}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {houses.map((entry) => {
              const aiHouse = transitData.houses?.find((house) => house.house === entry.house);
              const housePending = isLoadingTransitReading && !aiHouse;
              return (
              <article key={entry.house} className="border border-black/12 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-dusty-gold/30 bg-dusty-gold/[0.08] font-serif text-lg text-[#6f613a]">
                    {entry.house}
                  </span>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6f613a]">
                    {transitCopy.houseLabel ?? "Casa"}
                  </p>
                </div>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-ivory">
                  {aiHouse?.title ?? (housePending ? "..." : HOUSE_AREAS[entry.house])}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#3a3048]">
                  {aiHouse?.body ?? (housePending ? <span className="animate-pulse text-[#3a3048]">Generando...</span> : transitCopy.activatedAreaBody.replace("{points}", Array.from(entry.points).join(", ")))}
                </p>
              </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-10 max-w-5xl border-t border-black/[0.07]" />

      {activeTransits.length > 0 ? (
        <details className="mx-auto mt-10 max-w-5xl border-y border-black/10">
          <summary className="cursor-pointer list-none py-4 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6f613a]">
            {transitCopy.viewTransits}
          </summary>
          <div className="grid gap-3 pb-6">
            {activeTransits.map((transit) => (
              <div
                key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
                className="grid gap-2 border border-black/12 bg-white p-4 md:grid-cols-[0.8fr_1.2fr]"
              >
                <p className="text-sm text-[#6f613a]">
                  {pointLabel(transit.transitingPlanet)} {ASPECT_LABELS[transit.aspectType]} {pointLabel(transit.natalPlanet)}
                </p>
                <p className="text-sm leading-6 text-[#3a3048]">
                  {transitSentence(chart, transit)}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
