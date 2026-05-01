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
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        firmas de la carta
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            Regente de la carta
          </p>
          <h3 className="mt-2 font-serif text-[22px] leading-snug text-ivory">{ruler.label}</h3>
          {rulerPoint ? (
            <p className="mt-2 text-[13px] leading-6 text-[#3a3048]">
              {dictionary.result.signs[rulerPoint.sign]} · Casa {rulerPoint.house}
            </p>
          ) : null}
        </article>

        <article className="border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            Retrogrados
          </p>
          <h3 className="mt-2 font-serif text-[22px] leading-snug text-ivory">
            {retrogrades.length ? retrogrades.map((point) => dictionary.result.points[point.id]).join(" · ") : "—"}
          </h3>
        </article>
      </div>

      {patterns.length ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            Patrones mayores
          </p>
          <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
            {patterns.map((pattern) => (
              <article key={`${pattern.type}-${pattern.points.join("-")}`} className="py-3">
                <h3 className="font-serif text-[22px] leading-snug text-ivory">{pattern.title}</h3>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
