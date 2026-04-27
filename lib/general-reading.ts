import { getAugmentedChartPoints, zodiacSigns, type ChartPointId, type NatalChartData } from "@/lib/chart";

export const GENERAL_READING_THEMES = [
  "tu-esencia",
  "como-sientes",
  "como-amas",
  "como-piensas",
  "tu-proposito",
  "tus-desafios",
] as const;

export type GeneralReadingTheme = (typeof GENERAL_READING_THEMES)[number];

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
  northNode: "Nodo Norte",
  southNode: "Nodo Sur",
  chiron: "Quirón",
  partOfFortune: "Parte de la Fortuna",
  lilith: "Lilith",
};

const ASPECT_LABELS = {
  conjunction: "Conjunción",
  sextile: "Sextil",
  square: "Cuadratura",
  trine: "Trígono",
  opposition: "Oposición",
  quincunx: "Quincuncio",
} as const;

const RULERS = {
  aries: "Marte",
  taurus: "Venus",
  gemini: "Mercurio",
  cancer: "Luna",
  leo: "Sol",
  virgo: "Mercurio",
  libra: "Venus",
  scorpio: "Plutón",
  sagittarius: "Júpiter",
  capricorn: "Saturno",
  aquarius: "Urano",
  pisces: "Neptuno",
} as const;

function getSignName(signId: keyof typeof RULERS) {
  const labels = {
    aries: "Aries",
    taurus: "Tauro",
    gemini: "Géminis",
    cancer: "Cáncer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Escorpio",
    sagittarius: "Sagitario",
    capricorn: "Capricornio",
    aquarius: "Acuario",
    pisces: "Piscis",
  } as const;

  return labels[signId];
}

function getHouseSign(chart: NatalChartData, houseNumber: number) {
  const cusp = chart.houses.find((house) => house.house === houseNumber);
  if (!cusp) {
    return "libra" as const;
  }

  return zodiacSigns.find(
    (sign) => sign.start <= cusp.longitude && cusp.longitude < sign.start + 30,
  )?.id ?? "libra";
}

export function getChartSummaryForPrompt(chart: NatalChartData) {
  const points = getAugmentedChartPoints(chart);
  const ascSignId = zodiacSigns.find(
    (sign) => sign.start <= chart.meta.ascendant && chart.meta.ascendant < sign.start + 30,
  )?.id ?? "aries";
  const mcSignId = zodiacSigns.find(
    (sign) => sign.start <= chart.meta.mc && chart.meta.mc < sign.start + 30,
  )?.id ?? "capricorn";

  const pointsSummary = points
    .map((point) => {
      const pointName = POINT_LABELS[point.id] ?? point.id;
      const signName = getSignName(point.sign);
      return `• ${pointName} en ${signName} ${point.degreeInSign}° ${point.minutesInSign
        .toString()
        .padStart(2, "0")}', casa ${point.house}${point.retrograde ? " (Rx)" : ""}`;
    })
    .join("\n");

  const aspectsSummary = [...chart.aspects]
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 10)
    .map((aspect) => {
      const from = POINT_LABELS[aspect.from] ?? aspect.from;
      const to = POINT_LABELS[aspect.to] ?? aspect.to;
      return `• ${ASPECT_LABELS[aspect.type]} entre ${from} y ${to} (orbe ${aspect.orb.toFixed(1)}°)`;
    })
    .join("\n");

  return [
    `Ascendente en ${getSignName(ascSignId)} ${Math.floor(chart.meta.ascendant % 30)}° ${Math.round((chart.meta.ascendant % 1) * 60)
      .toString()
      .padStart(2, "0")}'`,
    `Medio Cielo en ${getSignName(mcSignId)} ${Math.floor(chart.meta.mc % 30)}° ${Math.round((chart.meta.mc % 1) * 60)
      .toString()
      .padStart(2, "0")}'`,
    "Puntos principales:",
    pointsSummary,
    "Aspectos clave:",
    aspectsSummary || "• Sin aspectos destacados",
  ].join("\n");
}

export function getThemeInstruction(chart: NatalChartData, theme: GeneralReadingTheme) {
  const points = getAugmentedChartPoints(chart);
  const sun = points.find((point) => point.id === "sun");
  const moon = points.find((point) => point.id === "moon");
  const venus = points.find((point) => point.id === "venus");
  const mercury = points.find((point) => point.id === "mercury");
  const saturn = points.find((point) => point.id === "saturn");
  const northNode = points.find((point) => point.id === "northNode");
  const ascSign = getSignName(
    zodiacSigns.find((sign) => sign.start <= chart.meta.ascendant && chart.meta.ascendant < sign.start + 30)?.id ?? "aries",
  );
  const mcSign = getSignName(
    zodiacSigns.find((sign) => sign.start <= chart.meta.mc && chart.meta.mc < sign.start + 30)?.id ?? "capricorn",
  );
  const seventhHouseSign = getHouseSign(chart, 7);
  const thirdHouseSign = getHouseSign(chart, 3);
  const hardAspects = chart.aspects
    .filter((aspect) => aspect.type === "square" || aspect.type === "opposition")
    .slice(0, 5)
    .map((aspect) => `${ASPECT_LABELS[aspect.type]} ${POINT_LABELS[aspect.from]} / ${POINT_LABELS[aspect.to]} (${aspect.orb.toFixed(1)}°)`)
    .join(", ");

  const instructions: Record<GeneralReadingTheme, string> = {
    "tu-esencia": `Escribe sobre cómo se manifiesta la esencia de ${chart.event.name} a través de su Sol en ${getSignName(sun?.sign ?? "leo")} y su Ascendente en ${ascSign}. Cómo se ve, cómo se presenta al mundo, qué energía irradia.`,
    "como-sientes": `Escribe sobre el mundo emocional de ${chart.event.name} a través de su Luna en ${getSignName(moon?.sign ?? "cancer")} en la casa ${moon?.house ?? 4}. Qué necesita emocionalmente, cómo procesa los sentimientos, qué le da seguridad interna.`,
    "como-amas": `Escribe sobre cómo ama ${chart.event.name} a través de su Venus en ${getSignName(venus?.sign ?? "libra")} en la casa ${venus?.house ?? 7}, y la energía de su casa 7 (regida por ${RULERS[seventhHouseSign]}). Cómo se vincula, qué busca en el otro, qué ofrece en el amor.`,
    "como-piensas": `Escribe sobre cómo piensa y se comunica ${chart.event.name} a través de su Mercurio en ${getSignName(mercury?.sign ?? "gemini")} en la casa ${mercury?.house ?? 3}, y la energía de su casa 3 en ${getSignName(thirdHouseSign)}. Cómo procesa información, cómo se expresa, qué tipo de mente tiene.`,
    "tu-proposito": `Escribe sobre el propósito de vida de ${chart.event.name} a través de su Medio Cielo en ${mcSign}, la casa 10, y su Nodo Norte en ${getSignName(northNode?.sign ?? "aries")} en la casa ${northNode?.house ?? 10}. Hacia dónde se dirige su evolución, qué debe desarrollar, qué legado puede construir.`,
    "tus-desafios": `Escribe sobre los desafíos centrales de ${chart.event.name} a través de Saturno en ${getSignName(saturn?.sign ?? "capricorn")} en la casa ${saturn?.house ?? 10}, y las cuadraturas/oposiciones más significativas de su carta (${hardAspects || "sin aspectos duros especialmente cerrados"}). Qué fricciones le piden madurar, qué patrones debe trabajar, qué le costará pero le hará crecer.`,
  };

  return instructions[theme];
}
