"use client";

import type { NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";
import type { ChartPattern } from "@/lib/chart-insights";
import { detectChartPatterns, getChartRuler, getRetrogradePoints } from "@/lib/chart-insights";

type ChartSignaturesSectionProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

function formatPatternTitle(pattern: ChartPattern, dictionary: Dictionary) {
  const templates = dictionary.result.chartSignatures.patterns;
  if (pattern.type === "t-square") {
    return templates.tSquare.replace("{glyph}", pattern.glyph ?? "");
  }

  if (pattern.type === "grand-trine") {
    const element = pattern.element ? dictionary.result.elements[pattern.element].toLowerCase() : "";
    return element
      ? templates.grandTrineElement.replace("{element}", element)
      : templates.grandTrine;
  }

  if (pattern.type === "yod") {
    return templates.yod.replace("{glyph}", pattern.glyph ?? "");
  }

  if (pattern.type === "stellium-sign") {
    const sign = pattern.sign ? dictionary.result.signs[pattern.sign] : "";
    return templates.stelliumSign.replace("{sign}", sign);
  }

  return templates.stelliumHouse.replace("{house}", String(pattern.house ?? ""));
}

export function ChartSignaturesSection({ chart, dictionary }: ChartSignaturesSectionProps) {
  const ruler = getChartRuler(chart);
  const retrogrades = getRetrogradePoints(chart);
  const patterns = detectChartPatterns(chart);
  const rulerPoint = ruler.primary;
  const rulerLabel = rulerPoint
    ? [
        dictionary.result.points[rulerPoint.id],
        ruler.traditional ? dictionary.result.points[ruler.traditional.id] : null,
      ].filter(Boolean).join(" / ")
    : ruler.label;

  return (
    <section className="mx-auto mb-12 max-w-[760px] overflow-hidden border-y border-dusty-gold/12 py-7">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {dictionary.result.chartSignatures.eyebrow}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="min-w-0 border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            {dictionary.result.chartSignatures.chartRuler}
          </p>
          <h3 className="mt-2 break-words font-serif text-[22px] leading-snug text-ivory">{rulerLabel}</h3>
          {rulerPoint ? (
            <p className="mt-2 text-[13px] leading-6 text-[#3a3048]">
              {dictionary.result.signs[rulerPoint.sign]} · {dictionary.result.fields.house} {rulerPoint.house}
            </p>
          ) : null}
        </article>

        <article className="min-w-0 border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            {dictionary.result.chartSignatures.retrogrades}
          </p>
          <h3 className="mt-2 break-words font-serif text-[22px] leading-snug text-ivory">
            {retrogrades.length ? retrogrades.map((point) => dictionary.result.points[point.id]).join(" · ") : "—"}
          </h3>
        </article>
      </div>

      {patterns.length ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            {dictionary.result.chartSignatures.majorPatterns}
          </p>
          <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
            {patterns.map((pattern) => (
              <article key={`${pattern.type}-${pattern.points.join("-")}`} className="py-3">
                <h3 className="break-words font-serif text-[22px] leading-snug text-ivory">
                  {formatPatternTitle(pattern, dictionary)}
                </h3>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
