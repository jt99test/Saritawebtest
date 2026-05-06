import { getAugmentedChartPoints, zodiacSigns, type ChartPointId, type NatalChartData } from "@/lib/chart";
import { getChartRuler } from "@/lib/chart-insights";
import { getAspectLabel, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { aspectPhrase, housePhrase, noMajorAspects, placementPhrase, transitMotionLabel } from "@/lib/prompt-i18n";

export const GENERAL_READING_THEMES = [
  "tu-esencia",
  "como-sientes",
  "que-das-valor",
  "como-piensas",
  "tu-proposito",
  "lo-que-suelto",
  "tu-herida-medicina",
  "tus-desafios",
  "tu-ascendente",
  "como-actuas",
  "donde-creces",
  "donde-rompes-esquemas",
  "donde-suenas",
  "donde-transformas",
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
  ceres: "Ceres",
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

const RULER_POINT_IDS = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "pluto",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "uranus",
  pisces: "neptune",
} as const satisfies Record<keyof typeof RULERS, ChartPointId>;

function getSignName(signId: keyof typeof RULERS, locale?: string) {
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

  return locale ? getSignLabel(signId, locale) : labels[signId];
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

export function getChartSummaryForPrompt(chart: NatalChartData, locale?: string) {
  const points = getAugmentedChartPoints(chart);
  const mcSignId = zodiacSigns.find(
    (sign) => sign.start <= chart.meta.mc && chart.meta.mc < sign.start + 30,
  )?.id ?? "capricorn";

  const pointsSummary = points
    .map((point) => {
      return `- ${placementPhrase({
        point: getPointLabel(point.id, locale),
        sign: getSignName(point.sign, locale),
        degree: point.degreeInSign,
        minutes: point.minutesInSign,
        house: point.house,
        retrograde: point.retrograde,
        locale,
      })}`;
    })
    .join("\n");

  const aspectsSummary = [...chart.aspects]
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 10)
    .map((aspect) => {
      return `- ${aspectPhrase({
        from: getPointLabel(aspect.from, locale),
        aspect: getAspectLabel(aspect.type, locale),
        to: getPointLabel(aspect.to, locale),
        orb: aspect.orb.toFixed(1),
        applying: aspect.applying,
        locale,
      })}`;
    })
    .join("\n");
  const ruler = getChartRuler(chart);
  return [
    locale === "en"
      ? `Midheaven in ${getSignName(mcSignId, locale)} ${Math.floor(chart.meta.mc % 30)}° ${Math.round((chart.meta.mc % 1) * 60)
        .toString()
        .padStart(2, "0")}'`
      : locale === "it"
        ? `Medio Cielo in ${getSignName(mcSignId, locale)} ${Math.floor(chart.meta.mc % 30)}° ${Math.round((chart.meta.mc % 1) * 60)
          .toString()
          .padStart(2, "0")}'`
        : `Medio Cielo en ${getSignName(mcSignId, locale)} ${Math.floor(chart.meta.mc % 30)}° ${Math.round((chart.meta.mc % 1) * 60)
      .toString()
      .padStart(2, "0")}'`,
    locale === "en"
      ? `Chart ruler: ${ruler.primary ? getPointLabel(ruler.primary.id, locale) : ruler.label}${ruler.primary ? ` in ${getSignName(ruler.primary.sign, locale)}, ${housePhrase(ruler.primary.house, locale)}` : ""}`
      : locale === "it"
        ? `Governatore della carta: ${ruler.primary ? getPointLabel(ruler.primary.id, locale) : ruler.label}${ruler.primary ? ` in ${getSignName(ruler.primary.sign, locale)}, ${housePhrase(ruler.primary.house, locale)}` : ""}`
        : `Regente de la carta: ${ruler.label}${ruler.primary ? ` en ${getSignName(ruler.primary.sign, locale)}, ${housePhrase(ruler.primary.house, locale)}` : ""}`,
    locale === "en" ? "Main points:" : locale === "it" ? "Punti principali:" : "Puntos principales:",
    pointsSummary,
    locale === "en" ? "Key aspects:" : locale === "it" ? "Aspetti chiave:" : "Aspectos clave:",
    aspectsSummary || `- ${noMajorAspects(locale)}`,
  ].join("\n");
}

export function getThemeInstruction(chart: NatalChartData, theme: GeneralReadingTheme, locale?: string) {
  const points = getAugmentedChartPoints(chart);
  const sun = points.find((point) => point.id === "sun");
  const moon = points.find((point) => point.id === "moon");
  const venus = points.find((point) => point.id === "venus");
  const mercury = points.find((point) => point.id === "mercury");
  const mars = points.find((point) => point.id === "mars");
  const jupiter = points.find((point) => point.id === "jupiter");
  const saturn = points.find((point) => point.id === "saturn");
  const uranus = points.find((point) => point.id === "uranus");
  const neptune = points.find((point) => point.id === "neptune");
  const pluto = points.find((point) => point.id === "pluto");
  const northNode = points.find((point) => point.id === "northNode");
  const southNode = points.find((point) => point.id === "southNode");
  const chiron = points.find((point) => point.id === "chiron");
  const ascSign = getSignName(
    zodiacSigns.find((sign) => sign.start <= chart.meta.ascendant && chart.meta.ascendant < sign.start + 30)?.id ?? "aries",
  );
  const mcSign = getSignName(
    zodiacSigns.find((sign) => sign.start <= chart.meta.mc && chart.meta.mc < sign.start + 30)?.id ?? "capricorn",
  );
  const seventhHouseSign = getHouseSign(chart, 7);
  const thirdHouseSign = getHouseSign(chart, 3);
  const seventhHouseRulerId = RULER_POINT_IDS[seventhHouseSign];
  const seventhHouseRuler = points.find((point) => point.id === seventhHouseRulerId);
  const seventhHouseRulerAspects = chart.aspects
    .filter((aspect) => aspect.from === seventhHouseRulerId || aspect.to === seventhHouseRulerId)
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 3)
    .map((aspect) => {
      const otherId = aspect.from === seventhHouseRulerId ? aspect.to : aspect.from;
      const other = points.find((point) => point.id === otherId);
      const otherHouse = other ? ` casa ${other.house}` : "";
      return `${ASPECT_LABELS[aspect.type]} con ${POINT_LABELS[otherId]}${otherHouse} (orbe ${aspect.orb.toFixed(1)} grados)`;
    })
    .join(", ");
  const hardAspects = chart.aspects
    .filter((aspect) => aspect.type === "square" || aspect.type === "opposition")
    .slice(0, 5)
    .map((aspect) => `${ASPECT_LABELS[aspect.type]} ${POINT_LABELS[aspect.from]} / ${POINT_LABELS[aspect.to]} (${aspect.orb.toFixed(1)}°)`)
    .join(", ");

  const seventhHouseRulerName = getPointLabel(seventhHouseRulerId, locale);

  if (locale === "en") {
    const instructions: Record<GeneralReadingTheme, string> = {
      "tu-esencia": `Write about how ${chart.event.name}'s essence shows through the Sun in ${getSignName(sun?.sign ?? "leo", locale)} in ${housePhrase(sun?.house ?? 5, locale)}. Name the vitality they radiate, the identity they are learning to inhabit, and what makes them feel genuinely themselves.`,
      "como-sientes": `Write about ${chart.event.name}'s emotional world through the Moon in ${getSignName(moon?.sign ?? "cancer", locale)} in ${housePhrase(moon?.house ?? 4, locale)}. Explain what they need emotionally, how they process feelings, and what creates inner safety.`,
      "que-das-valor": `Write about what ${chart.event.name} values through Venus in ${getSignName(venus?.sign ?? "libra", locale)} in ${housePhrase(venus?.house ?? 7, locale)}, plus the relationship tone of the 7th house in ${getSignName(seventhHouseSign, locale)}, ruled by ${seventhHouseRulerName}. The real natal placement of the 7th-house ruler is ${seventhHouseRulerName} in ${getSignName(seventhHouseRuler?.sign ?? seventhHouseSign, locale)} in ${housePhrase(seventhHouseRuler?.house ?? 7, locale)}; do not say it is in house 7 unless that is the real placement. Ruler aspects: ${seventhHouseRulerAspects || "no major highlighted aspects"}. Read Venus as desire, taste, self-worth, pleasure, beauty, bonds, and what they choose to care for.`,
      "como-piensas": `Write about how ${chart.event.name} thinks and communicates through Mercury in ${getSignName(mercury?.sign ?? "gemini", locale)} in ${housePhrase(mercury?.house ?? 3, locale)}, and the tone of the 3rd house in ${getSignName(thirdHouseSign, locale)}. Describe how they process information, express themselves, and what kind of mind they have.`,
      "tu-proposito": `Write about ${chart.event.name}'s life direction through the Midheaven in ${mcSign}, the 10th house, and the North Node in ${getSignName(northNode?.sign ?? "aries", locale)} in ${housePhrase(northNode?.house ?? 10, locale)}. Name where their evolution points, what they need to develop, and what kind of legacy they can build.`,
      "lo-que-suelto": `Write about ${chart.event.name}'s South Node in ${getSignName(southNode?.sign ?? "libra", locale)} in ${housePhrase(southNode?.house ?? 4, locale)}. Treat it as memory, familiar territory, old talent, automatic mechanism, and a pattern they are learning to release. Always connect it to the North Node: not as rejection of the past, but as conscious integration.`,
      "tu-herida-medicina": `Write about ${chart.event.name}'s Chiron in ${getSignName(chiron?.sign ?? "aries", locale)} in ${housePhrase(chiron?.house ?? 1, locale)}. Frame it as a central wound, therapeutic sensitivity, and medicine born from having lived through that vulnerability. Keep the tone psychological, careful, and non-fatalistic.`,
      "tus-desafios": `Write about ${chart.event.name}'s central challenges through Saturn in ${getSignName(saturn?.sign ?? "capricorn", locale)} in ${housePhrase(saturn?.house ?? 10, locale)}, and the most significant squares/oppositions in the chart (${hardAspects || "no especially tight hard aspects"}). Explain what friction asks them to mature, what patterns need work, and what will be hard but growth-producing.`,
      "tu-ascendente": `Write about ${chart.event.name}'s Ascendant in ${ascSign}. Focus fully on how it shapes outward personality, first impressions, and the way they enter life. Include the chart ruler from the general summary and explain how it speaks with the Sun in ${getSignName(sun?.sign ?? "leo", locale)} and Moon in ${getSignName(moon?.sign ?? "cancer", locale)}.`,
      "como-actuas": `Write about how ${chart.event.name} acts through Mars in ${getSignName(mars?.sign ?? "aries", locale)} in ${housePhrase(mars?.house ?? 1, locale)}. Describe drive, desire, physical energy, anger, courage, initiative, and conflict style.`,
      "donde-creces": `Write about where ${chart.event.name} grows through Jupiter in ${getSignName(jupiter?.sign ?? "sagittarius", locale)} in ${housePhrase(jupiter?.house ?? 9, locale)}. Describe expansion, opportunities, abundance, faith, luck, and learning.`,
      "donde-rompes-esquemas": `Write about where ${chart.event.name} breaks patterns through Uranus in ${getSignName(uranus?.sign ?? "aquarius", locale)} in ${housePhrase(uranus?.house ?? 11, locale)}. Describe independence, change, innovation, rebellion, and the need for freedom.`,
      "donde-suenas": `Write about where ${chart.event.name} dreams through Neptune in ${getSignName(neptune?.sign ?? "pisces", locale)} in ${housePhrase(neptune?.house ?? 12, locale)}. Describe spirituality, idealism, inspiration, sensitivity, illusion, and blurred boundaries.`,
      "donde-transformas": `Write about where ${chart.event.name} transforms through Pluto in ${getSignName(pluto?.sign ?? "scorpio", locale)} in ${housePhrase(pluto?.house ?? 8, locale)}. Describe power, shadow, intensity, grief, symbolic death, rebirth, and regeneration.`,
    };

    return instructions[theme];
  }

  if (locale === "it") {
    const instructions: Record<GeneralReadingTheme, string> = {
      "tu-esencia": `Scrivi come l'essenza di ${chart.event.name} si manifesta attraverso il Sole in ${getSignName(sun?.sign ?? "leo", locale)} in ${housePhrase(sun?.house ?? 5, locale)}. Indica la vitalita che emana, l'identita che sta imparando ad abitare e cio che la fa sentire davvero se stessa.`,
      "como-sientes": `Scrivi del mondo emotivo di ${chart.event.name} attraverso la Luna in ${getSignName(moon?.sign ?? "cancer", locale)} in ${housePhrase(moon?.house ?? 4, locale)}. Spiega di cosa ha bisogno emotivamente, come elabora i sentimenti e cosa le da sicurezza interiore.`,
      "que-das-valor": `Scrivi cio a cui ${chart.event.name} da valore attraverso Venere in ${getSignName(venus?.sign ?? "libra", locale)} in ${housePhrase(venus?.house ?? 7, locale)}, e il tono relazionale della casa 7 in ${getSignName(seventhHouseSign, locale)}, governata da ${seventhHouseRulerName}. La posizione natale reale del governatore della casa 7 e ${seventhHouseRulerName} in ${getSignName(seventhHouseRuler?.sign ?? seventhHouseSign, locale)} in ${housePhrase(seventhHouseRuler?.house ?? 7, locale)}; non dire che e in casa 7 salvo che sia davvero cosi. Aspetti del governatore: ${seventhHouseRulerAspects || "nessun aspetto principale evidenziato"}. Leggi Venere come desiderio, gusto, valore personale, piacere, bellezza, legami e cio che sceglie di curare.`,
      "como-piensas": `Scrivi come pensa e comunica ${chart.event.name} attraverso Mercurio in ${getSignName(mercury?.sign ?? "gemini", locale)} in ${housePhrase(mercury?.house ?? 3, locale)}, e il tono della casa 3 in ${getSignName(thirdHouseSign, locale)}. Descrivi come elabora le informazioni, come si esprime e che tipo di mente ha.`,
      "tu-proposito": `Scrivi del proposito di vita di ${chart.event.name} attraverso il Medio Cielo in ${mcSign}, la casa 10 e il Nodo Nord in ${getSignName(northNode?.sign ?? "aries", locale)} in ${housePhrase(northNode?.house ?? 10, locale)}. Indica verso dove punta l'evoluzione, cosa deve sviluppare e che eredita puo costruire.`,
      "lo-que-suelto": `Scrivi del Nodo Sud di ${chart.event.name} in ${getSignName(southNode?.sign ?? "libra", locale)} in ${housePhrase(southNode?.house ?? 4, locale)}. Interpretalo come memoria, zona conosciuta, talento antico, meccanismo automatico e schema che sta imparando a lasciare. Collegalo sempre al Nodo Nord: non come rifiuto del passato, ma come integrazione consapevole.`,
      "tu-herida-medicina": `Scrivi di Chirone di ${chart.event.name} in ${getSignName(chiron?.sign ?? "aries", locale)} in ${housePhrase(chiron?.house ?? 1, locale)}. Trattalo come ferita centrale, sensibilita terapeutica e medicina nata dall'attraversare quella vulnerabilita. Tono psicologico, delicato e non fatalista.`,
      "tus-desafios": `Scrivi delle sfide centrali di ${chart.event.name} attraverso Saturno in ${getSignName(saturn?.sign ?? "capricorn", locale)} in ${housePhrase(saturn?.house ?? 10, locale)}, e le quadrature/opposizioni piu significative della carta (${hardAspects || "nessun aspetto duro particolarmente stretto"}). Spiega quali attriti chiedono maturazione, quali schemi vanno lavorati e cosa sara impegnativo ma fertile.`,
      "tu-ascendente": `Scrivi dell'Ascendente di ${chart.event.name} in ${ascSign}. Concentrati su come modella personalita esterna, prime impressioni e modo di entrare nella vita. Includi il governatore della carta indicato nel riassunto generale e spiega come dialoga con il Sole in ${getSignName(sun?.sign ?? "leo", locale)} e la Luna in ${getSignName(moon?.sign ?? "cancer", locale)}.`,
      "como-actuas": `Scrivi di come agisce ${chart.event.name} attraverso Marte in ${getSignName(mars?.sign ?? "aries", locale)} in ${housePhrase(mars?.house ?? 1, locale)}. Descrivi impulso, desiderio, energia fisica, rabbia, coraggio, iniziativa e stile di conflitto.`,
      "donde-creces": `Scrivi dove cresce ${chart.event.name} attraverso Giove in ${getSignName(jupiter?.sign ?? "sagittarius", locale)} in ${housePhrase(jupiter?.house ?? 9, locale)}. Descrivi espansione, opportunita, abbondanza, fede, fortuna e apprendimento.`,
      "donde-rompes-esquemas": `Scrivi dove ${chart.event.name} rompe gli schemi attraverso Urano in ${getSignName(uranus?.sign ?? "aquarius", locale)} in ${housePhrase(uranus?.house ?? 11, locale)}. Descrivi indipendenza, cambiamento, innovazione, ribellione e bisogno di liberta.`,
      "donde-suenas": `Scrivi dove sogna ${chart.event.name} attraverso Nettuno in ${getSignName(neptune?.sign ?? "pisces", locale)} in ${housePhrase(neptune?.house ?? 12, locale)}. Descrivi spiritualita, idealismo, ispirazione, sensibilita, illusione e confini sfumati.`,
      "donde-transformas": `Scrivi dove si trasforma ${chart.event.name} attraverso Plutone in ${getSignName(pluto?.sign ?? "scorpio", locale)} in ${housePhrase(pluto?.house ?? 8, locale)}. Descrivi potere, ombra, intensita, lutto, morte simbolica, rinascita e rigenerazione.`,
    };

    return instructions[theme];
  }

  const instructions: Record<GeneralReadingTheme, string> = {
    "tu-esencia": `Escribe sobre cómo se manifiesta la esencia de ${chart.event.name} a través de su Sol en ${getSignName(sun?.sign ?? "leo")} en la casa ${sun?.house ?? 5}. Qué vitalidad irradia, qué identidad está aprendiendo a habitar y qué la hace sentirse verdaderamente ella misma.`,
    "como-sientes": `Escribe sobre el mundo emocional de ${chart.event.name} a través de su Luna en ${getSignName(moon?.sign ?? "cancer")} en la casa ${moon?.house ?? 4}. Qué necesita emocionalmente, cómo procesa los sentimientos, qué le da seguridad interna.`,
    "que-das-valor": `Escribe sobre lo que ${chart.event.name} valora a través de su Venus en ${getSignName(venus?.sign ?? "libra")} en la casa ${venus?.house ?? 7}, y la energía vincular de su casa 7 en ${getSignName(seventhHouseSign)}, regida por ${RULERS[seventhHouseSign]}. La ubicación natal real del regente de casa 7 es ${RULERS[seventhHouseSign]} en ${getSignName(seventhHouseRuler?.sign ?? seventhHouseSign)} en la casa ${seventhHouseRuler?.house ?? 7}; no digas que ${RULERS[seventhHouseSign]} está en casa 7 salvo que esta ubicación real sea casa 7. Aspectos del regente de casa 7: ${seventhHouseRulerAspects || "sin aspectos principales destacados"}. Enfoca Venus como deseo, gusto, valor personal, placer, belleza, vínculos y aquello que elige cuidar.`,
    "como-piensas": `Escribe sobre cómo piensa y se comunica ${chart.event.name} a través de su Mercurio en ${getSignName(mercury?.sign ?? "gemini")} en la casa ${mercury?.house ?? 3}, y la energía de su casa 3 en ${getSignName(thirdHouseSign)}. Cómo procesa información, cómo se expresa, qué tipo de mente tiene.`,
    "tu-proposito": `Escribe sobre el propósito de vida de ${chart.event.name} a través de su Medio Cielo en ${mcSign}, la casa 10, y su Nodo Norte en ${getSignName(northNode?.sign ?? "aries")} en la casa ${northNode?.house ?? 10}. Hacia dónde se dirige su evolución, qué debe desarrollar, qué legado puede construir.`,
    "lo-que-suelto": `Escribe sobre el Nodo Sur de ${chart.event.name} en ${getSignName(southNode?.sign ?? "libra")} en la casa ${southNode?.house ?? 4}. Interpreta este punto como memoria, zona conocida, talento antiguo, mecanismo automático y patrón que se está aprendiendo a soltar. Conecta siempre con el Nodo Norte: no como rechazo del pasado, sino como integración consciente.`,
    "tu-herida-medicina": `Escribe sobre Quirón de ${chart.event.name} en ${getSignName(chiron?.sign ?? "aries")} en la casa ${chiron?.house ?? 1}. Enfócalo como herida central, sensibilidad terapéutica y medicina que nace de haber atravesado esa vulnerabilidad. Tono psicológico, cuidadoso y no fatalista.`,
    "tus-desafios": `Escribe sobre los desafíos centrales de ${chart.event.name} a través de Saturno en ${getSignName(saturn?.sign ?? "capricorn")} en la casa ${saturn?.house ?? 10}, y las cuadraturas/oposiciones más significativas de su carta (${hardAspects || "sin aspectos duros especialmente cerrados"}). Qué fricciones le piden madurar, qué patrones debe trabajar, qué le costará pero le hará crecer.`,
    "tu-ascendente": `Escribe sobre el Ascendente de ${chart.event.name} en ${ascSign}. Enfócate por completo en cómo moldea su personalidad externa, primeras impresiones y manera de entrar en la vida. Incluye el regente de la carta indicado en el resumen general y explica cómo dialoga con su Sol en ${getSignName(sun?.sign ?? "leo")} y su Luna en ${getSignName(moon?.sign ?? "cancer")}.`,
    "como-actuas": `Escribe sobre cómo actúa ${chart.event.name} a través de Marte en ${getSignName(mars?.sign ?? "aries")} en la casa ${mars?.house ?? 1}. Describe impulso, deseo, energía física, enojo, coraje, iniciativa y estilo de conflicto.`,
    "donde-creces": `Escribe sobre dónde crece ${chart.event.name} a través de Júpiter en ${getSignName(jupiter?.sign ?? "sagittarius")} en la casa ${jupiter?.house ?? 9}. Describe expansión, oportunidades, abundancia, fe, suerte y aprendizaje.`,
    "donde-rompes-esquemas": `Escribe sobre dónde rompe esquemas ${chart.event.name} a través de Urano en ${getSignName(uranus?.sign ?? "aquarius")} en la casa ${uranus?.house ?? 11}. Describe independencia, cambio, innovación, rebeldía y necesidad de libertad.`,
    "donde-suenas": `Escribe sobre dónde sueña ${chart.event.name} a través de Neptuno en ${getSignName(neptune?.sign ?? "pisces")} en la casa ${neptune?.house ?? 12}. Describe espiritualidad, idealismo, inspiración, sensibilidad, ilusión y límites difusos.`,
    "donde-transformas": `Escribe sobre dónde transforma ${chart.event.name} a través de Plutón en ${getSignName(pluto?.sign ?? "scorpio")} en la casa ${pluto?.house ?? 8}. Describe poder, sombra, intensidad, duelo, muerte simbólica, renacimiento y regeneración.`,
  };

  return instructions[theme];
}
