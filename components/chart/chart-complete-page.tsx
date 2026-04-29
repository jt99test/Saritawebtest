"use client";

import { useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { recalculateHouseSystemAction, type HouseSystemCode } from "@/lib/actions";
import type { AspectId, ChartPoint, NatalChartData } from "@/lib/chart";
import { formatSignPosition } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";
import type { Dictionary } from "@/lib/i18n";

type ChartCompletePageProps = {
  chart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
};

const HOUSE_SYSTEMS: HouseSystemCode[] = ["P", "W", "K", "E"];
const POINT_ORDER = [
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
  "northNode",
  "southNode",
  "chiron",
  "lilith",
  "ceres",
  "partOfFortune",
] as const;

const ASPECT_SYMBOLS: Record<AspectId, string> = {
  conjunction: "☌",
  sextile: "✶",
  square: "□",
  trine: "△",
  opposition: "☍",
  quincunx: "⚻",
};

const DIGNITIES: Record<string, Partial<Record<string, string>>> = {
  sun: { leo: "Domicilio", aquarius: "Exilio", aries: "Exaltación", libra: "Caída" },
  moon: { cancer: "Domicilio", capricorn: "Exilio", taurus: "Exaltación", scorpio: "Caída" },
  mercury: { gemini: "Domicilio", virgo: "Domicilio", sagittarius: "Exilio", pisces: "Exilio" },
  venus: { taurus: "Domicilio", libra: "Domicilio", aries: "Exilio", scorpio: "Exilio", pisces: "Exaltación", virgo: "Caída" },
  mars: { aries: "Domicilio", scorpio: "Domicilio", libra: "Exilio", taurus: "Exilio", capricorn: "Exaltación", cancer: "Caída" },
  jupiter: { sagittarius: "Domicilio", pisces: "Domicilio", gemini: "Exilio", virgo: "Exilio", cancer: "Exaltación", capricorn: "Caída" },
  saturn: { capricorn: "Domicilio", aquarius: "Domicilio", cancer: "Exilio", leo: "Exilio", libra: "Exaltación", aries: "Caída" },
};

const SHAPE_DESCRIPTIONS: Record<string, string> = {
  Bundle: "La energía se concentra en una zona concreta de la vida.",
  Locomotive: "Hay impulso propio y una dirección que empuja la carta hacia adelante.",
  Bowl: "La carta trabaja por contraste: una mitad llena y otra que se busca completar.",
  Bucket: "Un planeta funciona como asa y canaliza mucha presión de la carta.",
  Seesaw: "La vida se organiza entre polos, vínculos y decisiones de equilibrio.",
  Splay: "La carta se expresa por focos distintos, con talentos separados pero fuertes.",
  Splash: "La energía está distribuida de forma amplia y curiosa.",
};

function pointName(point: ChartPoint, dictionary: Dictionary) {
  return dictionary.result.points[point.id as keyof typeof dictionary.result.points] ?? point.id;
}

function uniquePoints(chart: NatalChartData) {
  const byId = new Map<string, ChartPoint>();
  [...chart.points, ...(chart.extendedPoints ?? [])].forEach((point) => byId.set(point.id, point));
  return POINT_ORDER.map((id) => byId.get(id)).filter(Boolean) as ChartPoint[];
}

function dignity(point: ChartPoint) {
  return DIGNITIES[point.id]?.[point.sign] ?? "—";
}

function chartShape(chart: NatalChartData) {
  const longitudes = chart.points
    .filter((point) => POINT_ORDER.slice(0, 10).includes(point.id as (typeof POINT_ORDER)[number]))
    .map((point) => point.longitude)
    .sort((a, b) => a - b);

  if (longitudes.length < 2) {
    return "Splash";
  }

  const gaps = longitudes.map((longitude, index) => {
    const next = longitudes[(index + 1) % longitudes.length]!;
    return (next - longitude + 360) % 360;
  });
  const largestGap = Math.max(...gaps);
  const occupiedArc = 360 - largestGap;

  if (occupiedArc <= 120) return "Bundle";
  if (occupiedArc <= 180) return "Bowl";
  if (largestGap >= 120) return "Locomotive";
  if (gaps.filter((gap) => gap > 70).length >= 2) return "Seesaw";
  if (gaps.filter((gap) => gap > 45).length >= 3) return "Splay";
  return "Splash";
}

function aspectClass(type: AspectId) {
  if (type === "trine" || type === "sextile") return "text-[#8292d6]";
  if (type === "square" || type === "opposition") return "text-amber-200";
  return "text-ivory";
}

export function ChartCompletePage({ chart, request, dictionary }: ChartCompletePageProps) {
  const [currentChart, setCurrentChart] = useState(chart);
  const [houseSystem, setHouseSystem] = useState<HouseSystemCode>("P");
  const [showMatrix, setShowMatrix] = useState(false);
  const [cache, setCache] = useState<Record<string, NatalChartData>>({ P: chart });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const points = useMemo(() => uniquePoints(currentChart), [currentChart]);
  const shape = chartShape(currentChart);

  function switchHouseSystem(next: HouseSystemCode) {
    setError(null);
    setHouseSystem(next);
    const cached = cache[next];
    if (cached) {
      setCurrentChart(cached);
      return;
    }

    if (!request) {
      setError("No tengo los datos originales para recalcular este sistema en esta sesion.");
      return;
    }

    startTransition(async () => {
      try {
        const recalculated = await recalculateHouseSystemAction(request, next);
        setCache((current) => ({ ...current, [next]: recalculated }));
        setCurrentChart(recalculated);
      } catch {
        setError("No se pudo recalcular el sistema de casas. Intentalo otra vez.");
      }
    });
  }

  return (
    <section className="mx-auto max-w-5xl py-10">
      <div className="text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          {dictionary.result.completeChart.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[42px] leading-tight text-ivory">
          {dictionary.result.completeChart.shape}: {shape}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ivory/58">
          {SHAPE_DESCRIPTIONS[shape]}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {HOUSE_SYSTEMS.map((system) => (
          <button
            key={system}
            type="button"
            onClick={() => switchHouseSystem(system)}
            className={[
              "border px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] transition",
              houseSystem === system
                ? "border-dusty-gold/50 bg-dusty-gold/10 text-dusty-gold"
                : "border-white/10 text-ivory/48 hover:border-white/18 hover:text-ivory",
            ].join(" ")}
          >
            {dictionary.result.completeChart.houseSystems[system]}
          </button>
        ))}
        {isPending ? <span className="ml-2 text-xs uppercase tracking-[0.18em] text-dusty-gold/70">...</span> : null}
      </div>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-ivory/38">
        Sistema activo: {dictionary.result.completeChart.houseSystems[houseSystem]}
      </p>
      {error ? <p className="mt-3 text-center text-sm text-amber-100/80">{error}</p> : null}

      <div className="mt-8">
        <BiWheelChart
          innerChart={currentChart}
          innerLabel={currentChart.event.name}
          variant="solar-return"
        />
      </div>

      <details className="mt-8 border-y border-white/10">
        <summary className="cursor-pointer list-none py-4 text-center text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-dusty-gold/82">
          {dictionary.result.completeChart.tableTitle}
        </summary>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{dictionary.result.completeChart.tableTitle}</caption>
          <thead>
            <tr className="text-left text-[0.62rem] uppercase tracking-[0.2em] text-ivory/42">
              {dictionary.result.completeChart.columns.map((column) => (
                <th key={column || "glyph"} className="border-b border-white/10 px-3 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => {
              const signPosition = formatSignPosition(point.longitude);

              return (
                <tr key={point.id} className="border-b border-white/7 last:border-b-0">
                  <td className="px-3 py-3 font-serif text-xl" style={{ color: point.color }}>{point.glyph}</td>
                  <td className="px-3 py-3 text-ivory/82">{pointName(point, dictionary)}</td>
                  <td className="px-3 py-3 text-ivory/62">{dictionary.result.signs[point.sign]}</td>
                  <td className="px-3 py-3 text-ivory/62">{signPosition.degreeInSign}° {String(signPosition.minutesInSign).padStart(2, "0")}'</td>
                  <td className="px-3 py-3 text-ivory/62">{point.house}</td>
                  <td className="px-3 py-3 text-ivory/62">{point.retrograde ? "℞" : ""}</td>
                  <td className="px-3 py-3 text-dusty-gold/70">{dignity(point)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </details>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setShowMatrix((current) => !current)}
          className="border border-dusty-gold/28 bg-dusty-gold/[0.055] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-dusty-gold/86"
        >
          {showMatrix ? dictionary.result.completeChart.hideAspects : dictionary.result.completeChart.showAspects}
        </button>
      </div>

      {showMatrix ? (
        <div className="mt-6 overflow-x-auto border-y border-white/10 py-4">
          <table className="mx-auto min-w-[720px] border-collapse text-center text-xs">
            <tbody>
              {points.slice(0, 12).map((rowPoint) => (
                <tr key={rowPoint.id}>
                  <th className="sticky left-0 bg-cosmic-950 px-2 py-2 text-left font-serif text-lg text-ivory/70">
                    {rowPoint.glyph}
                  </th>
                  {points.slice(0, 12).map((columnPoint) => {
                    const aspect = currentChart.aspects.find((entry) =>
                      (entry.from === rowPoint.id && entry.to === columnPoint.id) ||
                      (entry.to === rowPoint.id && entry.from === columnPoint.id),
                    );
                    return (
                      <td key={columnPoint.id} className="h-9 w-9 border border-white/7">
                        {aspect ? (
                          <span className={aspectClass(aspect.type)}>{ASPECT_SYMBOLS[aspect.type]}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
