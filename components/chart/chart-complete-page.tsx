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
  jupiter: "JÃºpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "PlutÃ³n",
  northNode: "Nodo norte",
  southNode: "Nodo sur",
  chiron: "QuirÃ³n",
};

const ASPECT_LABELS: Record<ActiveTransit["aspectType"], string> = {
  conjunction: "toca directamente",
  opposition: "pone en espejo",
  square: "tensiona",
  trine: "abre una vÃ­a fluida hacia",
  sextile: "ofrece una oportunidad a",
  quincunx: "pide ajustar",
};

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad, cuerpo y forma de entrar en la vida",
  2: "valor propio, dinero y seguridad interna",
  3: "voz, mente cotidiana, aprendizaje y conversaciones",
  4: "raÃ­z emocional, hogar, familia y pertenencia",
  5: "deseo, creatividad, placer y expresiÃ³n personal",
  6: "hÃ¡bitos, trabajo diario, salud y orden corporal",
  7: "pareja, vÃ­nculos, acuerdos y espejos relacionales",
  8: "intimidad, sombra, duelos, poder y transformaciÃ³n",
  9: "sentido, fe, viajes, estudios y visiÃ³n de mundo",
  10: "vocaciÃ³n, visibilidad, autoridad y direcciÃ³n vital",
  11: "amistades, redes, comunidad y futuro compartido",
  12: "inconsciente, descanso, cierre de ciclos y vida espiritual",
};

const PLANET_LANGUAGE: Partial<Record<ChartPointId, string>> = {
  saturn: "Saturno pide estructura, lÃ­mites y madurez. No empuja rÃ¡pido: obliga a elegir quÃ© sostener de verdad.",
  jupiter: "JÃºpiter amplÃ­a el campo. Muestra dÃ³nde hay crecimiento, confianza y una puerta que se abre si te atreves a ocupar mÃ¡s espacio.",
  uranus: "Urano despierta lo que estaba dormido. Trae cambio, independencia y una necesidad de romper una forma vieja.",
  neptune: "Neptuno sensibiliza y disuelve. Pide escuchar lo invisible, pero tambiÃ©n cuidar las fantasÃ­as que nublan la decisiÃ³n.",
  pluto: "PlutÃ³n intensifica. Va a la raÃ­z de un patrÃ³n y empuja una transformaciÃ³n profunda, no superficial.",
  mars: "Marte activa deseo, impulso y fricciÃ³n. Muestra dÃ³nde necesitas actuar, defenderte o mover energÃ­a estancada.",
  venus: "Venus abre preguntas de valor, vÃ­nculo y placer. SeÃ±ala dÃ³nde algo necesita mÃ¡s belleza, reciprocidad o cuidado.",
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
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/70">
          {transitCopy.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[42px] leading-tight text-ivory md:text-[56px]">
          {transitCopy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ivory/58">
          {transitCopy.description}
        </p>
        {result?.ok ? (
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82">
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
          <div className="mx-auto flex min-h-[420px] max-w-[860px] items-center justify-center border border-white/10 bg-white/[0.025] text-center">
            <div>
              <p className="font-serif text-3xl text-ivory">{isPending ? transitCopy.calculatingHeading : transitCopy.errorHeading}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ivory/52">
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
          <article className="border border-dusty-gold/20 bg-dusty-gold/[0.055] p-6 md:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/88">
              {transitCopy.mostActiveEyebrow}
            </p>
            <h3 className="mt-3 font-serif text-3xl leading-tight text-ivory">
              {transitData.dominantTitle ?? (waitingForTransitData ? "..." : `${pointLabel(dominantTransit.transitingPlanet)} está activando tu ${pointLabel(dominantTransit.natalPlanet)}`)}
            </h3>
            <p className="mt-4 text-base leading-8 text-ivory/72">
              {transitData.dominantBody ?? (waitingForTransitData ? <span className="animate-pulse text-ivory/35">Generando...</span> : `${transitSentence(chart, dominantTransit)} Este tránsito no describe un destino cerrado: muestra el lenguaje evolutivo del momento, la parte de ti que está siendo llamada a responder con más conciencia.`)}
            </p>
          </article>

          <article className="border border-white/10 bg-white/[0.025] p-6 md:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/82">
              {transitCopy.planetLanguageEyebrow}
            </p>
            <p className="mt-4 text-base leading-8 text-ivory/68">
              {transitData.planetLanguage ?? (waitingForTransitData ? <span className="animate-pulse text-ivory/35">Generando...</span> : PLANET_LANGUAGE[dominantTransit.transitingPlanet] ?? "Este planeta marca una zona de aprendizaje activo y pide presencia.")}
            </p>
            <p className="mt-5 text-sm leading-7 text-ivory/48">
              {transitCopy.orbLabel} {dominantTransit.orb}° · {dominantTransit.strength === "tight" ? transitCopy.strengthTight : dominantTransit.strength === "moderate" ? transitCopy.strengthModerate : transitCopy.strengthLoose}
            </p>
          </article>
        </div>
      ) : result?.ok ? (
        <div className="mx-auto mt-12 max-w-3xl border border-white/10 bg-white/[0.025] p-7 text-center">
          <h3 className="font-serif text-3xl text-ivory">{transitCopy.silentSkyHeading}</h3>
          <p className="mt-4 text-sm leading-7 text-ivory/58">
            {transitCopy.silentSkyBody}
          </p>
        </div>
      ) : null}

      {(isLoadingTransitReading || transitReading) ? (
        <div className="mx-auto mt-8 max-w-3xl border-y border-dusty-gold/14 py-7">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">{transitCopy.readingEyebrow}</p>
          {isLoadingTransitReading && !transitReading ? (
            <p className="mt-4 animate-pulse text-base leading-8 text-ivory/35">{transitCopy.readingLoading}</p>
          ) : (
            proseTransitReading.split("\n\n").filter(Boolean).map((para, i) => (
              <p key={i} className="mt-4 text-base leading-8 text-ivory/82">{para}</p>
            ))
          )}
        </div>
      ) : null}

      {activeTransits.length > 0 ? (
        <div className="mx-auto mt-10 max-w-5xl border-t border-white/10 pt-8">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">
            {transitCopy.activatedAreasEyebrow}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {houses.map((entry) => {
              const aiHouse = transitData.houses?.find((house) => house.house === entry.house);
              const housePending = isLoadingTransitReading && !aiHouse;
              return (
              <article key={entry.house} className="border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82">
                  casa {entry.house}
                </p>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-ivory">
                  {aiHouse?.title ?? (housePending ? "..." : HOUSE_AREAS[entry.house])}
                </h3>
                <p className="mt-4 text-sm leading-7 text-ivory/58">
                  {aiHouse?.body ?? (housePending ? <span className="animate-pulse text-ivory/35">Generando...</span> : transitCopy.activatedAreaBody.replace("{points}", Array.from(entry.points).join(", ")))}
                </p>
              </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTransits.length > 0 ? (
        <details className="mx-auto mt-10 max-w-5xl border-y border-white/10">
          <summary className="cursor-pointer list-none py-4 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82">
            {transitCopy.viewTransits}
          </summary>
          <div className="grid gap-3 pb-6">
            {activeTransits.map((transit) => (
              <div
                key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
                className="grid gap-2 border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[0.8fr_1.2fr]"
              >
                <p className="text-sm text-dusty-gold/82">
                  {pointLabel(transit.transitingPlanet)} {ASPECT_LABELS[transit.aspectType]} {pointLabel(transit.natalPlanet)}
                </p>
                <p className="text-sm leading-6 text-ivory/58">
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
