"use client";

import { useMemo, useState } from "react";

import { formatSignPosition, getAugmentedChartPoints, type NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";

type ChartGeneralReadingProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

type ReadingCard = {
  id: string;
  title: string;
  oneLiner: string;
  fullText: string[];
};

function buildReadingCards(chart: NatalChartData, dictionary: Dictionary): ReadingCard[] {
  const points = getAugmentedChartPoints(chart);
  const sun = points.find((point) => point.id === "sun");
  const venus = points.find((point) => point.id === "venus");
  const mercury = points.find((point) => point.id === "mercury");
  const saturn = points.find((point) => point.id === "saturn");
  const northNode = points.find((point) => point.id === "northNode");
  const ascendantSign = dictionary.result.signs[formatSignPosition(chart.meta.ascendant).sign];
  const mcSign = dictionary.result.signs[formatSignPosition(chart.meta.mc).sign];
  const sunSign = sun ? dictionary.result.signs[sun.sign] : ascendantSign;
  const venusSign = venus ? dictionary.result.signs[venus.sign] : dictionary.result.signs.libra;
  const mercurySign = mercury ? dictionary.result.signs[mercury.sign] : dictionary.result.signs.gemini;
  const saturnSign = saturn ? dictionary.result.signs[saturn.sign] : dictionary.result.signs.capricorn;
  const nodeSign = northNode ? dictionary.result.signs[northNode.sign] : mcSign;

  return [
    {
      id: "essence",
      title: dictionary.result.generalReading.cards.essence.title,
      oneLiner: `${dictionary.result.generalReading.cards.essence.oneLiner} ${sunSign} y ${ascendantSign}.`,
      fullText: [
        `${dictionary.result.generalReading.cards.essence.paragraphs[0]} ${sunSign} marca el tono central de la identidad, mientras ${ascendantSign} define la forma en que esa esencia entra en contacto con el mundo.`,
        dictionary.result.generalReading.cards.essence.paragraphs[1],
      ],
    },
    {
      id: "love",
      title: dictionary.result.generalReading.cards.love.title,
      oneLiner: `${dictionary.result.generalReading.cards.love.oneLiner} ${venusSign} y la casa 7.`,
      fullText: [
        `${dictionary.result.generalReading.cards.love.paragraphs[0]} Venus en ${venusSign} da pistas sobre el gusto, el afecto y la manera de elegir vínculos significativos.`,
        dictionary.result.generalReading.cards.love.paragraphs[1],
      ],
    },
    {
      id: "mind",
      title: dictionary.result.generalReading.cards.mind.title,
      oneLiner: `${dictionary.result.generalReading.cards.mind.oneLiner} ${mercurySign} y la casa 3.`,
      fullText: [
        `${dictionary.result.generalReading.cards.mind.paragraphs[0]} Mercurio en ${mercurySign} matiza la voz, el ritmo mental y la manera de hilar ideas.`,
        dictionary.result.generalReading.cards.mind.paragraphs[1],
      ],
    },
    {
      id: "purpose",
      title: dictionary.result.generalReading.cards.purpose.title,
      oneLiner: `${dictionary.result.generalReading.cards.purpose.oneLiner} ${mcSign} y ${nodeSign}.`,
      fullText: [
        `${dictionary.result.generalReading.cards.purpose.paragraphs[0]} El Medio Cielo en ${mcSign} y el Nodo Norte en ${nodeSign} apuntan hacia una dirección vocacional y evolutiva que pide tiempo para desplegarse.`,
        dictionary.result.generalReading.cards.purpose.paragraphs[1],
      ],
    },
    {
      id: "challenges",
      title: dictionary.result.generalReading.cards.challenges.title,
      oneLiner: `${dictionary.result.generalReading.cards.challenges.oneLiner} ${saturnSign} y las tensiones activas.`,
      fullText: [
        `${dictionary.result.generalReading.cards.challenges.paragraphs[0]} Saturno en ${saturnSign} suele señalar exigencias, límites y una disciplina que se aprende atravesando fricción.`,
        dictionary.result.generalReading.cards.challenges.paragraphs[1],
      ],
    },
  ];
}

export function ChartGeneralReading({ chart, dictionary }: ChartGeneralReadingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const cards = useMemo(() => buildReadingCards(chart, dictionary), [chart, dictionary]);

  return (
    <section className="space-y-6">
      <div className="text-center lg:text-left">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-dusty-gold/72">
          {dictionary.result.generalReading.eyebrow}
        </p>
        <h2 className="mt-4 text-3xl text-ivory sm:text-[2.5rem]">
          {dictionary.result.generalReading.title}
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const expanded = expandedId === card.id;

          return (
            <article
              key={card.id}
              className="group rounded-[1.9rem] border border-dusty-gold/20 bg-[linear-gradient(180deg,rgba(18,11,31,0.78),rgba(8,10,18,0.64))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl transition duration-300 hover:border-dusty-gold/34 hover:shadow-[0_18px_50px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-dusty-gold/68">
                    {card.title}
                  </p>
                  <p className="mt-4 text-lg leading-8 text-ivory/88">{card.oneLiner}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : card.id)}
                  className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ivory/62 transition hover:border-dusty-gold/26 hover:text-ivory"
                >
                  {expanded ? dictionary.common.hide : dictionary.result.generalReading.readMore}
                </button>
              </div>

              {expanded ? (
                <div className="mt-5 space-y-4 border-t border-white/8 pt-5 text-sm leading-7 text-ivory/68">
                  {card.fullText.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
