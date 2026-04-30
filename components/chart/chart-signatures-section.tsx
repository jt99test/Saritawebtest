"use client";

import type { NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import { detectChartPatterns, getChartRuler, getRetrogradePoints } from "@/lib/chart-insights";

type ChartSignaturesSectionProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

export function ChartSignaturesSection({ chart, dictionary }: ChartSignaturesSectionProps) {
  const ruler = getChartRuler(chart);
  const retrogrades = getRetrogradePoints(chart);
  const patterns = detectChartPatterns(chart);
  const rulerPoint = ruler.primary;

  return (
    <section className="mx-auto mb-12 max-w-[760px] border-y border-dusty-gold/12 py-7">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">
        firmas de la carta
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="border border-white/8 bg-white/[0.02] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/72">
            Regente de la carta
          </p>
          <h3 className="mt-3 font-serif text-2xl text-ivory">{ruler.label}</h3>
          <p className="mt-3 text-sm leading-7 text-ivory/62">
            El Ascendente esta regido por {ruler.label}. Este planeta colorea la forma en que toda la carta entra en la vida.
            {rulerPoint ? ` En tu carta aparece en ${dictionary.result.signs[rulerPoint.sign]}, casa ${rulerPoint.house}.` : ""}
          </p>
        </article>

        <article className="border border-white/8 bg-white/[0.02] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/72">
            Retrogrados
          </p>
          <h3 className="mt-3 font-serif text-2xl text-ivory">
            {retrogrades.length ? `${retrogrades.length} planetas internos` : "Sin enfasis retrogrado"}
          </h3>
          <p className="mt-3 text-sm leading-7 text-ivory/62">
            Un planeta retrogrado no es malo: suele vivirse hacia dentro, con mas revision, memoria y elaboracion subjetiva.
            {retrogrades.length ? ` En esta carta destacan ${retrogrades.map((point) => dictionary.result.points[point.id]).join(", ")}.` : ""}
          </p>
        </article>
      </div>

      {patterns.length ? (
        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/72">
            Patrones mayores
          </p>
          <div className="mt-3 grid gap-3">
            {patterns.map((pattern) => (
              <article key={`${pattern.type}-${pattern.points.join("-")}`} className="border-l border-dusty-gold/22 pl-4">
                <h3 className="font-serif text-xl text-ivory">{pattern.title}</h3>
                <p className="mt-1 text-sm leading-7 text-ivory/58">{pattern.description}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-xs leading-6 text-ivory/42">
        Sistema de casas: Placidus por defecto. Los planetas no cambian de grado entre sistemas; lo que cambia es la casa, es decir, el area de vida donde se interpreta esa energia.
      </p>
    </section>
  );
}
