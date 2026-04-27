"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import type { NatalChartData, ChartPointId, Element } from "@/lib/chart";
import type { LunarReportCacheEntry } from "@/lib/lunar-report";

import { getSignFromLongitude, zodiacSigns } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import { getAllCachedLunarReports } from "@/lib/lunar-report-cache";
import { illustrations } from "@/data/illustrations";
import { yogaRoutines } from "@/data/sarita/yoga-routines";

type YogaAstralPageProps = {
  chart: NatalChartData;
};

type RoutineElement = keyof typeof yogaRoutines;

type CachedMonthlyRoutine = {
  key: string;
  entry: LunarReportCacheEntry;
};

const ELEMENT_LABELS: Record<RoutineElement, string> = {
  fuego: "Fuego",
  tierra: "Tierra",
  agua: "Agua",
  aire: "Aire",
};

const ELEMENT_ALT_TEXT: Record<RoutineElement, string> = {
  fuego: "Ilustración del elemento Fuego",
  tierra: "Ilustración del elemento Tierra",
  agua: "Ilustración del elemento Agua",
  aire: "Ilustración del elemento Aire",
};

const ELEMENT_HEADLINES: Record<RoutineElement, string> = {
  fuego: "Encender el Fuego",
  tierra: "Aterrizar en la Tierra",
  aire: "Despejar el Aire",
  agua: "Soltar en el Agua",
};

const ELEMENT_COPY: Record<RoutineElement, string> = {
  fuego:
    "Esta luna te pide encender. La rutina del Fuego activa lo cardinal y rompe el estancamiento.",
  tierra:
    "Esta luna te pide aterrizar. La rutina de la Tierra ancla el cuerpo y devuelve la presencia.",
  aire:
    "Esta luna te pide claridad. La rutina del Aire abre el pecho y mueve la palabra.",
  agua:
    "Esta luna te pide soltar. La rutina del Agua disuelve la coraza y devuelve la fluidez.",
};

const ELEMENT_ESSENCE: Record<RoutineElement, string> = {
  fuego: "Para encender lo que se apagó.",
  tierra: "Para aterrizar lo que flota.",
  aire: "Para despejar lo que pesa.",
  agua: "Para soltar lo que se aferra.",
};

const ANCHOR_REASON: Record<Element, string> = {
  fire: "Tu fuego se dispersa. Esta postura lo concentra.",
  earth: "Tu peso se vuelve rigidez. Esta postura lo afloja.",
  air: "Tu mente se va. Esta postura te trae de vuelta al eje.",
  water: "Tu sensibilidad te disuelve. Esta postura te contiene.",
};

const ANCHOR_POSE_BY_ELEMENT: Record<
  Element,
  { slug: string; label: string; summary: string }
> = {
  fire: {
    slug: "tadasana",
    label: "Tadasana Activa",
    summary:
      "Tu energía necesita una postura que te ordene, te centre y te recuerde desde dónde nace tu impulso.",
  },
  earth: {
    slug: "malasana",
    label: "Malasana",
    summary:
      "Tu energía se regula mejor cuando bajas al cuerpo, conectas con el suelo y sostienes el peso con presencia.",
  },
  water: {
    slug: "anjaneyasana",
    label: "Anjaneyasana Profundo",
    summary:
      "Tu energía pide apertura sensible, espacio en la pelvis y una práctica que deje circular lo emocional sin forzarlo.",
  },
  air: {
    slug: "anahatasana",
    label: "Anahatasana",
    summary:
      "Tu energía encuentra eje cuando respiras más amplio, abres el pecho y das aire a lo que se ha quedado retenido.",
  },
};

const TRADITIONAL_POINT_IDS = new Set<ChartPointId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);

const mojibakePattern = /[\u00C3\u00C2\u00E2]/;

function decodeMojibake(value: string) {
  if (!mojibakePattern.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8").decode(
      Uint8Array.from(value, (character) => character.charCodeAt(0)),
    );
  } catch {
    return value;
  }
}

function displayText(value: string) {
  return decodeMojibake(value).replace(/\s+\u00B7\s+/g, " · ").replace(/Ã‚Â·/g, "·").trim();
}

function formatElementForMetadata(element: Element) {
  return ELEMENT_LABELS[toRoutineElement(element)];
}

function toRoutineElement(element: Element): RoutineElement {
  return element === "fire"
    ? "fuego"
    : element === "earth"
      ? "tierra"
      : element === "water"
        ? "agua"
        : "aire";
}

function getDominantElement(chart: NatalChartData): Element {
  const counts: Record<Element, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };

  for (const point of chart.points) {
    if (!TRADITIONAL_POINT_IDS.has(point.id)) {
      continue;
    }

    const signMeta = zodiacSigns.find((entry) => entry.id === point.sign);
    if (signMeta) {
      counts[signMeta.element] += 1;
    }
  }

  const ascendantSign = getSignFromLongitude(chart.meta.ascendant);
  const ascendantMeta = zodiacSigns.find((entry) => entry.id === ascendantSign);
  if (ascendantMeta) {
    counts[ascendantMeta.element] += 1;
  }

  return (Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "fire") as Element;
}

function parseCachedLunationKey(
  key: string,
): { year: number; month: number; type: "nueva" | "llena" } | null {
  const match = key.match(/^(\d{4})-(\d{2})-(nueva|llena)$/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    type: match[3] as "nueva" | "llena",
  };
}

function chooseMonthlyRoutine(
  reports: Record<string, LunarReportCacheEntry>,
  chart: NatalChartData,
): CachedMonthlyRoutine | null {
  const now = DateTime.now().setZone(chart.event.timezoneIdentifier || "UTC");
  const currentPrefix = now.toFormat("yyyy-LL");
  const currentMonthEntries = Object.entries(reports).filter(([key]) =>
    key.startsWith(`${currentPrefix}-`),
  );

  if (currentMonthEntries.length > 0) {
    const currentNueva = currentMonthEntries.find(([key]) => key.endsWith("-nueva"));
    if (currentNueva) {
      return { key: currentNueva[0], entry: currentNueva[1] };
    }

    const nearestCurrent = currentMonthEntries
      .map(([key, entry]) => ({
        key,
        entry,
        distance: Math.abs(
          DateTime.fromISO(entry.metadata.timestamp)
            .setZone(chart.event.timezoneIdentifier || "UTC")
            .diff(now)
            .as("milliseconds"),
        ),
      }))
      .sort((left, right) => left.distance - right.distance)[0];

    return nearestCurrent
      ? {
          key: nearestCurrent.key,
          entry: nearestCurrent.entry,
        }
      : null;
  }

  const nearestAny = Object.entries(reports)
    .map(([key, entry]) => {
      const parsed = parseCachedLunationKey(key);
      const timestamp = DateTime.fromISO(entry.metadata.timestamp).setZone(
        chart.event.timezoneIdentifier || "UTC",
      );

      return {
        key,
        entry,
        parsed,
        futureBias:
          timestamp >= now ? timestamp.diff(now).as("milliseconds") : Number.POSITIVE_INFINITY,
        absoluteDistance: Math.abs(timestamp.diff(now).as("milliseconds")),
      };
    })
    .sort((left, right) => {
      if (left.futureBias !== right.futureBias) {
        return left.futureBias - right.futureBias;
      }

      if (left.absoluteDistance !== right.absoluteDistance) {
        return left.absoluteDistance - right.absoluteDistance;
      }

      const leftParsed = left.parsed ? left.parsed.year * 100 + left.parsed.month : 0;
      const rightParsed = right.parsed ? right.parsed.year * 100 + right.parsed.month : 0;
      return rightParsed - leftParsed;
    })[0];

  return nearestAny
    ? {
        key: nearestAny.key,
        entry: nearestAny.entry,
      }
    : null;
}

function getAnchorPose(chart: NatalChartData) {
  const dominantElement = getDominantElement(chart);
  const anchor = ANCHOR_POSE_BY_ELEMENT[dominantElement];
  const routineKey = toRoutineElement(dominantElement);
  const routine = yogaRoutines[routineKey];
  const asana = routine.asanas.find((item) => item.slug === anchor.slug);

  return {
    element: dominantElement,
    label: formatElementForMetadata(dominantElement),
    summary: anchor.summary,
    asana: asana ?? null,
  };
}

function getRoutineNames(element: RoutineElement) {
  return yogaRoutines[element].asanas
    .slice(0, 3)
    .map((asana) => displayText(asana.nameSanskrit))
    .join(" · ");
}

function getRoutineMeta(element: RoutineElement) {
  const routine = yogaRoutines[element];
  return [
    getRoutineNames(element),
    `${displayText(routine.chakra.name)} · ${displayText(routine.chakra.mantra)}`,
    displayText(routine.totalDuration),
  ].join(" · ");
}

function getPortalMeta(element: RoutineElement) {
  const routine = yogaRoutines[element];
  return [
    routine.planets.map(displayText).join(", "),
    routine.signs.map(displayText).join(", "),
    displayText(routine.chakra.name),
  ].join(" · ");
}

export function YogaAstralPage({ chart }: YogaAstralPageProps) {
  const [cachedReports, setCachedReports] = useState<Record<string, LunarReportCacheEntry>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCache() {
      const chartHash = await hashNatalChart(chart);
      if (cancelled) {
        return;
      }

      setCachedReports(getAllCachedLunarReports(chartHash));
    }

    void loadCache();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  const monthlyRoutine = useMemo(
    () => chooseMonthlyRoutine(cachedReports, chart),
    [cachedReports, chart],
  );
  const anchorPose = useMemo(() => getAnchorPose(chart), [chart]);
  const fallbackElement = toRoutineElement(anchorPose.element);
  const monthlyElement = monthlyRoutine?.entry.metadata.assignedRoutine ?? fallbackElement;
  const anchorImage = anchorPose.asana?.imagePath ?? illustrations.elements[fallbackElement];
  const anchorName = anchorPose.asana
    ? displayText(anchorPose.asana.nameSanskrit)
    : ANCHOR_POSE_BY_ELEMENT[anchorPose.element].label;
  const anchorSpanish = anchorPose.asana
    ? displayText(anchorPose.asana.nameSpanish).toLowerCase()
    : anchorName.toLowerCase();
  const anchorDescription = anchorPose.asana
    ? displayText(anchorPose.asana.description)
    : anchorPose.summary;

  return (
    <div className="pb-24 pt-24">
      <header className="text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          yoga astral
        </p>
        <h1 className="mt-2 font-serif text-[64px] font-normal leading-none tracking-[-0.01em] text-white lg:text-[88px]">
          El cuerpo como mapa.
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] font-serif text-[17px] italic leading-[1.6] text-white/55 lg:max-w-[580px] lg:text-[19px]">
          Cuatro rutinas para los cuatro elementos. Cada luna te asigna una. Cada postura te devuelve algo.
        </p>
      </header>

      <section className="mx-auto mt-16 max-w-[1040px] border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20 lg:max-w-[1080px]">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          tu rutina del mes
        </p>

        <div className="mt-6 grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div className="flex justify-center">
            <Image
              src={illustrations.elements[monthlyElement]}
              alt={ELEMENT_ALT_TEXT[monthlyElement]}
              width={440}
              height={440}
              priority
              className="h-auto w-full max-w-[440px] lg:max-w-[480px]"
              sizes="(max-width: 1024px) 80vw, 440px"
            />
          </div>

          <div>
            {monthlyRoutine ? (
              <>
                <p className="font-serif text-[13px] italic lowercase text-white/50">
                  esta luna te pide
                </p>
                <h2 className="mt-2 font-serif text-[48px] font-normal leading-tight text-white lg:text-[64px]">
                  {ELEMENT_HEADLINES[monthlyElement]}
                </h2>
                <p className="mt-6 font-serif text-lg leading-[1.6] text-white/80 lg:max-w-[440px] lg:text-[20px] lg:leading-[1.7]">
                  {ELEMENT_COPY[monthlyElement]}
                </p>
                <p className="mt-8 font-serif text-[13px] italic leading-7 text-white/50">
                  {getRoutineMeta(monthlyElement)}
                </p>
                <Link
                  href={`/yoga-astral/${monthlyElement}`}
                  className="group mt-8 inline-flex items-center gap-2 font-serif text-base text-dusty-gold/90 transition hover:text-dusty-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60 lg:text-lg"
                >
                  <span>Entrar en la rutina</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </>
            ) : (
              <>
                <p className="max-w-[420px] font-serif text-[17px] italic leading-8 text-white/50">
                  Visita la Luna del mes para que te asignemos una rutina.
                </p>
                <Link
                  href="/luna-del-mes"
                  className="group mt-8 inline-flex items-center gap-2 font-serif text-base text-dusty-gold/90 transition hover:text-dusty-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60 lg:text-lg"
                >
                  <span>Ir a Luna del mes</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[960px] border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20 lg:max-w-[1080px]">
        <div className="text-center">
          <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
            las cuatro rutinas
          </p>
          <h2 className="mt-2 font-serif text-[36px] font-normal leading-tight text-white lg:text-[48px]">
            Elige tu cauce
          </h2>
        </div>

        <div className="mt-16 grid gap-x-16 gap-y-20 md:grid-cols-2 lg:gap-x-20 lg:gap-y-24">
          {(Object.entries(yogaRoutines) as [RoutineElement, (typeof yogaRoutines)[RoutineElement]][]).map(
            ([element]) => (
              <Link
                href={`/yoga-astral/${element}`}
                key={element}
                className="group block cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60"
              >
                <Image
                  src={illustrations.elements[element]}
                  alt={ELEMENT_ALT_TEXT[element]}
                  width={260}
                  height={260}
                  className="mx-auto h-[200px] w-auto object-contain transition duration-[350ms] group-hover:scale-[1.02] group-hover:brightness-[1.15] lg:h-[260px]"
                  sizes="260px"
                />
                <h3 className="mt-8 font-serif text-[32px] font-normal leading-tight text-white transition-colors duration-[250ms] group-hover:text-dusty-gold lg:text-[38px]">
                  {`Elemento ${ELEMENT_LABELS[element]}`}
                </h3>
                <p className="relative mx-auto mt-3 max-w-[280px] font-serif text-sm italic leading-6 text-white/55 lg:max-w-[320px] lg:text-base">
                  <span>{ELEMENT_ESSENCE[element]}</span>
                  <span className="mx-auto mt-3 block h-px w-12 origin-center scale-x-0 bg-dusty-gold/55 transition-transform duration-300 group-hover:scale-x-100" />
                </p>
                <p className="mx-auto mt-6 max-w-[360px] font-serif text-xs italic leading-6 text-white/40">
                  {getPortalMeta(element)}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="mt-16 w-full border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20">
        <div className="text-center">
          <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
            tu postura ancla
          </p>
          <p className="mx-auto mt-3 max-w-[480px] font-serif text-[15px] italic leading-7 text-white/55">
            Una postura para cuando todo lo demás se mueve. Tuya, por tu carta.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-[880px] gap-12 lg:max-w-[1040px] lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex justify-center">
            <Image
              src={anchorImage}
              alt={`Fotografía de ${anchorName}`}
              width={420}
              height={420}
              className="h-auto w-full max-w-[360px] lg:max-w-[440px]"
              sizes="(max-width: 1024px) 80vw, 360px"
            />
          </div>

          <div>
            <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-white/50">
              {`para tu ${anchorPose.label.toLowerCase()} dominante`}
            </p>
            <h2 className="mt-2 font-serif text-[40px] font-normal leading-tight text-white lg:text-[52px]">
              {anchorName}
            </h2>
            <p className="mt-1 font-serif text-sm italic lowercase tracking-[0.1em] text-dusty-gold/70">
              {anchorSpanish}
            </p>
            <p className="mt-8 max-w-[380px] font-serif text-[17px] leading-[1.7] text-white/85 lg:max-w-[440px] lg:text-[19px]">
              {anchorDescription}
            </p>
            <p className="mt-6 max-w-[380px] font-serif text-sm italic leading-[1.6] text-white/55">
              {ANCHOR_REASON[anchorPose.element]}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[720px] border-t-[0.5px] border-dusty-gold/12 pt-8 lg:mt-[120px]">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
              kriya
            </p>
            <h2 className="mt-1 font-serif text-2xl font-normal leading-tight text-white lg:text-[26px]">
              Lavado intestinal corto
            </h2>
            <p className="mt-1 font-serif text-[13px] italic leading-6 text-white/50">
              Práctica de limpieza profunda · 3 días
            </p>
          </div>

          <Link
            href="/yoga-astral/kriyas/lavado-intestinal"
            className="group inline-flex items-center gap-2 font-serif text-[15px] text-dusty-gold/90 transition hover:text-dusty-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60"
          >
            <span>Ver protocolo</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
