import type { GeneralReadingTheme } from "@/lib/general-reading";
import { formatSignPosition, getAugmentedChartPoints, type NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";

export type GeneralReadingCard = {
  id: string;
  theme: GeneralReadingTheme;
  title: string;
  oneLiner: string;
  fullText: string | string[];
};

export function getGeneralReadingCards(chart: NatalChartData, dictionary: Dictionary): GeneralReadingCard[] {
  const points = getAugmentedChartPoints(chart);
  const sun = points.find((point) => point.id === "sun");
  const moon = points.find((point) => point.id === "moon");
  const venus = points.find((point) => point.id === "venus");
  const mercury = points.find((point) => point.id === "mercury");
  const saturn = points.find((point) => point.id === "saturn");
  const northNode = points.find((point) => point.id === "northNode");
  const ascendantSign = dictionary.result.signs[formatSignPosition(chart.meta.ascendant).sign];
  const mcSign = dictionary.result.signs[formatSignPosition(chart.meta.mc).sign];
  const sunSign = sun ? dictionary.result.signs[sun.sign] : ascendantSign;
  const moonSign = moon ? dictionary.result.signs[moon.sign] : dictionary.result.signs.cancer;
  const venusSign = venus ? dictionary.result.signs[venus.sign] : dictionary.result.signs.libra;
  const mercurySign = mercury ? dictionary.result.signs[mercury.sign] : dictionary.result.signs.gemini;
  const saturnSign = saturn ? dictionary.result.signs[saturn.sign] : dictionary.result.signs.capricorn;
  const nodeSign = northNode ? dictionary.result.signs[northNode.sign] : mcSign;
  const moonHouse = moon?.house ?? 4;

  return [
    {
      id: "essence",
      theme: "tu-esencia",
      title: dictionary.result.generalReading.cards.essence.title,
      oneLiner: `${dictionary.result.generalReading.cards.essence.oneLiner} ${sunSign} y ${ascendantSign}.`,
      fullText: [
        `${dictionary.result.generalReading.cards.essence.paragraphs[0]} ${sunSign} marca el tono central de la identidad, mientras ${ascendantSign} define la forma en que esa esencia entra en contacto con el mundo.`,
        dictionary.result.generalReading.cards.essence.paragraphs[1],
      ],
    },
    {
      id: "feelings",
      theme: "como-sientes",
      title: dictionary.result.generalReading.cards.feelings.title,
      oneLiner: `Tu mundo emocional se organiza desde ${moonSign} y la casa ${moonHouse}.`,
      fullText:
        `${dictionary.result.generalReading.cards.feelings.fullText} ${moonSign} y la casa ${moonHouse} nos dan una base clara para desarrollar después una lectura emocional más fina y personalizada.`,
    },
    {
      id: "love",
      theme: "como-amas",
      title: dictionary.result.generalReading.cards.love.title,
      oneLiner: `${dictionary.result.generalReading.cards.love.oneLiner} ${venusSign} y la casa 7.`,
      fullText: [
        `${dictionary.result.generalReading.cards.love.paragraphs[0]} Venus en ${venusSign} da pistas sobre el gusto, el afecto y la manera de elegir vínculos significativos.`,
        dictionary.result.generalReading.cards.love.paragraphs[1],
      ],
    },
    {
      id: "mind",
      theme: "como-piensas",
      title: dictionary.result.generalReading.cards.mind.title,
      oneLiner: `${dictionary.result.generalReading.cards.mind.oneLiner} ${mercurySign} y la casa 3.`,
      fullText: [
        `${dictionary.result.generalReading.cards.mind.paragraphs[0]} Mercurio en ${mercurySign} matiza la voz, el ritmo mental y la manera de hilar ideas.`,
        dictionary.result.generalReading.cards.mind.paragraphs[1],
      ],
    },
    {
      id: "purpose",
      theme: "tu-proposito",
      title: dictionary.result.generalReading.cards.purpose.title,
      oneLiner: `${dictionary.result.generalReading.cards.purpose.oneLiner} ${mcSign} y ${nodeSign}.`,
      fullText: [
        `${dictionary.result.generalReading.cards.purpose.paragraphs[0]} El Medio Cielo en ${mcSign} y el Nodo Norte en ${nodeSign} apuntan hacia una dirección vocacional y evolutiva que pide tiempo para desplegarse.`,
        dictionary.result.generalReading.cards.purpose.paragraphs[1],
      ],
    },
    {
      id: "challenges",
      theme: "tus-desafios",
      title: dictionary.result.generalReading.cards.challenges.title,
      oneLiner: `${dictionary.result.generalReading.cards.challenges.oneLiner} ${saturnSign} y las tensiones activas.`,
      fullText: [
        `${dictionary.result.generalReading.cards.challenges.paragraphs[0]} Saturno en ${saturnSign} suele señalar exigencias, límites y una disciplina que se aprende atravesando fricción.`,
        dictionary.result.generalReading.cards.challenges.paragraphs[1],
      ],
    },
  ];
}
