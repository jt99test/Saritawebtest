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
import { PrimaryButton } from "@/components/ui/primary-button";
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

const ASTRO_SOMATIC_COPY: Record<RoutineElement, string> = {
  fuego: "En el cuerpo, el Fuego se vive como impulso, calor, direccion y centro. Esta rutina organiza esa fuerza para que la accion no salga desde la prisa, sino desde presencia.",
  tierra: "En el cuerpo, la Tierra se manifiesta como peso, apoyo, estructura y seguridad. Esta rutina baja la energia al suelo para que la estabilidad no se vuelva rigidez.",
  aire: "En el cuerpo, el Aire aparece en respiracion, pecho, brazos, cuello y palabra. Esta rutina crea espacio para pensar, comunicar y moverte sin quedar atrapada en la cabeza.",
  agua: "En el cuerpo, el Agua se expresa como memoria emocional, pelvis, tejidos blandos y capacidad de soltar. Esta rutina ayuda a que lo sensible circule sin inundarte.",
};

const ELEMENT_ESSENCE: Record<RoutineElement, string> = {
  fuego: "Para encender lo que se apagó.",
  tierra: "Para aterrizar lo que flota.",
  aire: "Para despejar lo que pesa.",
  agua: "Para soltar lo que se aferra.",
};

const ELEMENT_BADGE_CLASSES: Record<RoutineElement, string> = {
  fuego: "border-red-700/25 bg-red-50 text-red-800",
  tierra: "border-emerald-700/25 bg-emerald-50 text-emerald-800",
  agua: "border-sky-700/25 bg-sky-50 text-sky-800",
  aire: "border-teal-700/25 bg-teal-50 text-teal-800",
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

function getElementCounts(chart: NatalChartData): Record<Element, number> {
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

  return counts;
}

function getSortedElements(chart: NatalChartData) {
  const counts = getElementCounts(chart);
  const order: Element[] = ["fire", "earth", "air", "water"];

  return order
    .map((element) => ({ element, count: counts[element] }))
    .sort((left, right) => right.count - left.count);
}

function getDominantElement(chart: NatalChartData): Element {
  // Count the ten main planets plus the Ascendant by sign element, then pick the highest count.
  return getSortedElements(chart)[0]?.element ?? "fire";
}

function getBlendedRoutine(chart: NatalChartData) {
  const [first, second] = getSortedElements(chart);

  if (!first || !second || first.count - second.count > 2) {
    return null;
  }

  const firstKey = toRoutineElement(first.element);
  const secondKey = toRoutineElement(second.element);
  const firstAsanas = yogaRoutines[firstKey].asanas.slice(
    0,
    Math.ceil(yogaRoutines[firstKey].asanas.length / 2),
  );
  const secondAsanas = yogaRoutines[secondKey].asanas.slice(
    0,
    Math.floor(yogaRoutines[secondKey].asanas.length / 2),
  );

  return {
    primary: firstKey,
    secondary: secondKey,
    asanas: [...firstAsanas, ...secondAsanas],
  };
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
  const blendedRoutine = useMemo(() => getBlendedRoutine(chart), [chart]);
  const anchorPose = useMemo(() => getAnchorPose(chart), [chart]);
  const fallbackElement = toRoutineElement(anchorPose.element);
  const monthlyElement = blendedRoutine?.primary ?? monthlyRoutine?.entry.metadata.assignedRoutine ?? fallbackElement;
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
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-sm leading-7 text-[#3a3048]">
          El yoga astral conecta los elementos de tu carta natal con rutinas de movimiento y respiración. Según tu elemento dominante, el cuerpo responde mejor a ciertos tipos de práctica. Aquí encuentras la rutina que va con tu energía de este mes.
        </p>
      </div>

      <header className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          yoga astral
        </p>
        <h1 className="mt-2 font-serif text-[64px] font-normal leading-none tracking-[-0.01em] text-ivory lg:text-[88px]">
          El cuerpo como mapa.
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] font-serif text-[17px] italic leading-[1.6] text-[#3a3048] lg:max-w-[580px] lg:text-[19px]">
          Cuatro rutinas para los cuatro elementos. Cada luna te asigna una. Cada postura te devuelve algo.
        </p>
      </header>

      <section className="mx-auto mt-16 max-w-[1040px] border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20 lg:max-w-[1080px]">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
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
            {monthlyRoutine || blendedRoutine ? (
              <>
                <p className="font-serif text-[13px] italic lowercase text-[#3a3048]">
                  {blendedRoutine ? "rutina combinada" : "esta luna te pide"}
                </p>
                <h2 className="mt-2 font-serif text-[48px] font-normal leading-tight text-ivory lg:text-[64px]">
                  {blendedRoutine
                    ? `${ELEMENT_LABELS[blendedRoutine.primary]} + ${ELEMENT_LABELS[blendedRoutine.secondary]}`
                    : ELEMENT_HEADLINES[monthlyElement]}
                </h2>
                <p className="mt-6 font-serif text-lg leading-[1.6] text-ivory/80 lg:max-w-[440px] lg:text-[20px] lg:leading-[1.7]">
                  {blendedRoutine
                    ? `En tu carta, ${ELEMENT_LABELS[blendedRoutine.primary]} y ${ELEMENT_LABELS[blendedRoutine.secondary]} se responden. Esta práctica cruza sus ritmos para que la mente, el cuerpo y la respiración encuentren un mismo cauce.`
                    : ELEMENT_COPY[monthlyElement]}
                </p>
                <p className="mt-4 max-w-[460px] text-sm leading-7 text-[#3a3048]">
                  {blendedRoutine
                    ? `${ASTRO_SOMATIC_COPY[blendedRoutine.primary]} ${ASTRO_SOMATIC_COPY[blendedRoutine.secondary]}`
                    : ASTRO_SOMATIC_COPY[monthlyElement]}
                </p>
                <p className="mt-8 font-serif text-[13px] italic leading-7 text-[#3a3048]">
                  {blendedRoutine
                    ? blendedRoutine.asanas.slice(0, 5).map((asana) => displayText(asana.nameSanskrit)).join(" · ")
                    : getRoutineMeta(monthlyElement)}
                </p>
                {blendedRoutine ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {blendedRoutine.asanas.map((asana) => (
                      <span
                        key={`${asana.element}-${asana.slug}`}
                        className={`border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] ${ELEMENT_BADGE_CLASSES[asana.element]}`}
                      >
                        {ELEMENT_LABELS[asana.element]} · {displayText(asana.nameSanskrit)}
                      </span>
                    ))}
                  </div>
                ) : null}
                <PrimaryButton
                  href={`/yoga-astral/${monthlyElement}`}
                  variant="ghostGold"
                  className="mt-8 px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
                >
                  Entrar en la rutina
                </PrimaryButton>
              </>
            ) : (
              <>
                <p className="max-w-[420px] font-serif text-[17px] italic leading-8 text-[#3a3048]">
                  Visita la Luna del mes para que te asignemos una rutina.
                </p>
                <PrimaryButton
                  href="/luna-del-mes"
                  variant="ghostGold"
                  className="mt-8 px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
                >
                  Ir a Luna del mes
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[960px] border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20 lg:max-w-[1080px]">
        <div className="text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            las cuatro rutinas
          </p>
          <h2 className="mt-2 font-serif text-[36px] font-normal leading-tight text-ivory lg:text-[48px]">
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
                <h3 className="mt-8 font-serif text-[32px] font-normal leading-tight text-ivory transition-colors duration-[250ms] group-hover:text-dusty-gold lg:text-[38px]">
                  {`Elemento ${ELEMENT_LABELS[element]}`}
                </h3>
                <p className="relative mx-auto mt-3 max-w-[280px] font-serif text-sm italic leading-6 text-[#3a3048] lg:max-w-[320px] lg:text-base">
                  <span>{ELEMENT_ESSENCE[element]}</span>
                  <span className="mx-auto mt-3 block h-px w-12 origin-center scale-x-0 bg-dusty-gold/55 transition-transform duration-300 group-hover:scale-x-100" />
                </p>
                <p className="mx-auto mt-6 max-w-[360px] font-serif text-xs italic leading-6 text-[#3a3048]">
                  {getPortalMeta(element)}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="mt-16 w-full border-t-[0.5px] border-dusty-gold/12 pt-10 lg:mt-20">
        <div className="text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            tu postura ancla
          </p>
          <p className="mx-auto mt-3 max-w-[480px] font-serif text-[15px] italic leading-7 text-[#3a3048]">
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
            <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[#3a3048]">
              {`para tu ${anchorPose.label.toLowerCase()} dominante`}
            </p>
            <h2 className="mt-2 font-serif text-[40px] font-normal leading-tight text-ivory lg:text-[52px]">
              {anchorName}
            </h2>
            <p className="mt-1 font-serif text-sm italic lowercase tracking-[0.1em] text-[#5c4a24]">
              {anchorSpanish}
            </p>
            <p className="mt-8 max-w-[380px] font-serif text-[17px] leading-[1.7] text-ivory/85 lg:max-w-[440px] lg:text-[19px]">
              {anchorDescription}
            </p>
            <p className="mt-6 max-w-[380px] font-serif text-sm italic leading-[1.6] text-[#3a3048]">
              {ANCHOR_REASON[anchorPose.element]}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[720px] border-t-[0.5px] border-dusty-gold/12 pt-8 lg:mt-[120px]">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
              kriya
            </p>
            <h2 className="mt-1 font-serif text-2xl font-normal leading-tight text-ivory lg:text-[26px]">
              Lavado intestinal corto
            </h2>
            <p className="mt-1 font-serif text-[13px] italic leading-6 text-[#3a3048]">
              Práctica de limpieza profunda · 3 días
            </p>
          </div>

          <PrimaryButton
            href="/yoga-astral/kriyas/lavado-intestinal"
            variant="ghostGold"
            className="self-start px-5 py-3 text-[12px] uppercase tracking-[0.2em] sm:self-auto"
          >
            Ver protocolo
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
