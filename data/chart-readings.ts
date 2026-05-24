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

function localeFromDictionary(dictionary: Dictionary) {
  if (dictionary.nav.help === "Help") return "en";
  if (dictionary.nav.help === "Aiuto") return "it";
  return "es";
}

function fallbackCopy(dictionary: Dictionary) {
  const locale = localeFromDictionary(dictionary);

  if (locale === "en") {
    return {
      essenceLead: (sign: string) => `${dictionary.result.generalReading.cards.essence.paragraphs[0]} The Sun in ${sign} sets the central tone of identity and the place where vitality begins.`,
      feelingsOne: (sign: string, house: number) => `Your emotional world organizes itself through ${sign} and house ${house}.`,
      feelingsFull: (sign: string, house: number) => `${dictionary.result.generalReading.cards.feelings.fullText} ${sign} and house ${house} give a clear base for a more precise emotional reading later.`,
      loveLead: (sign: string) => `${dictionary.result.generalReading.cards.love.paragraphs[0]} Venus in ${sign} points to taste, self-worth, pleasure, and the way you choose meaningful bonds.`,
      mindLead: (sign: string) => `${dictionary.result.generalReading.cards.mind.paragraphs[0]} Mercury in ${sign} shapes the voice, mental rhythm, and the way ideas connect.`,
      purposeLead: (mc: string, node: string) => `${dictionary.result.generalReading.cards.purpose.paragraphs[0]} The Midheaven in ${mc} and North Node in ${node} point to a vocational and developmental direction that unfolds over time.`,
      southTitle: "What you release",
      southOne: (sign: string) => `Your familiar memory leans on ${sign}.`,
      southText: (sign: string) => [`The South Node in ${sign} shows an old talent, a comfort zone, and an automatic pattern.`, "This is not about rejecting that place, but recognizing it so the North Node can open a new direction."],
      chironTitle: "Your wound medicine",
      chironOne: (sign: string) => `Chiron opens a deep sensitivity through ${sign}.`,
      chironText: (sign: string) => [`Chiron in ${sign} names a wound that is not solved by force, but by presence, listening, and maturity.`, "Where vulnerability once lived, a form of care and medicine for others can also appear."],
      challengesLead: (sign: string) => `${dictionary.result.generalReading.cards.challenges.paragraphs[0]} Saturn in ${sign} often points to demands, limits, and discipline learned through friction.`,
      ascLead: (sign: string) => `${dictionary.result.generalReading.cards.ascendant.paragraphs[0]} The Ascendant in ${sign} describes a learning path: the direction life keeps inviting you to grow into.`,
      actionFull: (sign: string) => `Mars in ${sign} opens the reading of desire, action, healthy anger, and the way you defend your own path.`,
      growthFull: (sign: string) => `Jupiter in ${sign} shows where life expands: confidence, opportunity, learning, and meaning.`,
      breakthroughFull: (sign: string) => `Uranus in ${sign} marks where the chart needs freedom, change, and innovation.`,
      dreamsFull: (sign: string) => `Neptune in ${sign} opens the field of inspiration, sensitivity, spirituality, and porous boundaries.`,
      transformationFull: (sign: string) => `Pluto in ${sign} points to intensity, shadow, power, and processes of death and rebirth.`,
    };
  }

  if (locale === "it") {
    return {
      essenceLead: (sign: string) => `${dictionary.result.generalReading.cards.essence.paragraphs[0]} Il Sole in ${sign} imposta il tono centrale dell'identita e il punto da cui nasce la vitalita.`,
      feelingsOne: (sign: string, house: number) => `Il tuo mondo emotivo si organizza attraverso ${sign} e la casa ${house}.`,
      feelingsFull: (sign: string, house: number) => `${dictionary.result.generalReading.cards.feelings.fullText} ${sign} e la casa ${house} danno una base chiara per una lettura emotiva piu precisa.`,
      loveLead: (sign: string) => `${dictionary.result.generalReading.cards.love.paragraphs[0]} Venere in ${sign} indica gusto, valore personale, piacere e modo di scegliere legami significativi.`,
      mindLead: (sign: string) => `${dictionary.result.generalReading.cards.mind.paragraphs[0]} Mercurio in ${sign} sfuma la voce, il ritmo mentale e il modo di collegare le idee.`,
      purposeLead: (mc: string, node: string) => `${dictionary.result.generalReading.cards.purpose.paragraphs[0]} Il Medio Cielo in ${mc} e il Nodo Nord in ${node} indicano una direzione vocazionale ed evolutiva che si dispiega nel tempo.`,
      southTitle: "Cio che lasci andare",
      southOne: (sign: string) => `La tua memoria conosciuta si appoggia a ${sign}.`,
      southText: (sign: string) => [`Il Nodo Sud in ${sign} mostra un talento antico, una zona comoda e una ripetizione automatica.`, "Non si tratta di negare quel luogo, ma di riconoscerlo per permettere al Nodo Nord di aprire una direzione nuova."],
      chironTitle: "La tua ferita medicina",
      chironOne: (sign: string) => `Chirone apre una sensibilita profonda attraverso ${sign}.`,
      chironText: (sign: string) => [`Chirone in ${sign} nomina una ferita che non si risolve con la forza, ma con presenza, ascolto e maturita.`, "Dove c'e stata vulnerabilita puo nascere anche una forma di accompagnamento e medicina per gli altri."],
      challengesLead: (sign: string) => `${dictionary.result.generalReading.cards.challenges.paragraphs[0]} Saturno in ${sign} spesso indica richieste, limiti e una disciplina imparata attraversando attrito.`,
      ascLead: (sign: string) => `${dictionary.result.generalReading.cards.ascendant.paragraphs[0]} L'Ascendente in ${sign} descrive un cammino di apprendimento: la direzione verso cui la vita ti invita a crescere.`,
      actionFull: (sign: string) => `Marte in ${sign} apre la lettura del desiderio, dell'azione, della rabbia sana e del modo di difendere il proprio cammino.`,
      growthFull: (sign: string) => `Giove in ${sign} mostra dove la vita si allarga: fiducia, opportunita, apprendimento e senso.`,
      breakthroughFull: (sign: string) => `Urano in ${sign} indica il punto in cui la carta ha bisogno di liberta, cambiamento e innovazione.`,
      dreamsFull: (sign: string) => `Nettuno in ${sign} apre la zona dell'ispirazione, della sensibilita, della spiritualita e dei confini sfumati.`,
      transformationFull: (sign: string) => `Plutone in ${sign} segnala dove ci sono intensita, ombra, potere e processi di morte e rinascita.`,
    };
  }

  return {
    essenceLead: (sign: string) => `${dictionary.result.generalReading.cards.essence.paragraphs[0]} ${sign} marca el tono central de la identidad y el lugar desde donde nace la vitalidad.`,
    feelingsOne: (sign: string, house: number) => `Tu mundo emocional se organiza desde ${sign} y la casa ${house}.`,
    feelingsFull: (sign: string, house: number) => `${dictionary.result.generalReading.cards.feelings.fullText} ${sign} y la casa ${house} nos dan una base clara para desarrollar despues una lectura emocional mas fina y personalizada.`,
    loveLead: (sign: string) => `${dictionary.result.generalReading.cards.love.paragraphs[0]} Venus en ${sign} da pistas sobre el gusto, el valor personal, el placer y la manera de elegir vinculos significativos.`,
    mindLead: (sign: string) => `${dictionary.result.generalReading.cards.mind.paragraphs[0]} Mercurio en ${sign} matiza la voz, el ritmo mental y la manera de hilar ideas.`,
    purposeLead: (mc: string, node: string) => `${dictionary.result.generalReading.cards.purpose.paragraphs[0]} El Medio Cielo en ${mc} y el Nodo Norte en ${node} apuntan hacia una direccion vocacional y evolutiva que pide tiempo para desplegarse.`,
    southTitle: "Lo que sueltas",
    southOne: (sign: string) => `Tu memoria conocida se apoya en ${sign}.`,
    southText: (sign: string) => [`El Nodo Sur en ${sign} muestra una zona de talento antiguo, comodidad y repeticion automatica.`, "No se trata de negar ese lugar, sino de reconocerlo para que el Nodo Norte pueda abrir una direccion nueva."],
    chironTitle: "Tu herida medicina",
    chironOne: (sign: string) => `Quiron abre una sensibilidad profunda desde ${sign}.`,
    chironText: (sign: string) => [`Quiron en ${sign} nombra una herida que no se resuelve por fuerza, sino por presencia, escucha y madurez.`, "Ahi donde hubo vulnerabilidad tambien aparece una forma de acompanamiento y medicina para otros."],
    challengesLead: (sign: string) => `${dictionary.result.generalReading.cards.challenges.paragraphs[0]} Saturno en ${sign} suele senalar exigencias, limites y una disciplina que se aprende atravesando friccion.`,
    ascLead: (sign: string) => `${dictionary.result.generalReading.cards.ascendant.paragraphs[0]} El Ascendente en ${sign} describe una ruta de aprendizaje: la direccion hacia la que la vida te invita a crecer.`,
    actionFull: (sign: string) => `Marte en ${sign} abre la lectura del deseo, la accion, el enojo sano y la manera de defender el propio camino.`,
    growthFull: (sign: string) => `Jupiter en ${sign} muestra donde la vida se ensancha: confianza, oportunidades, aprendizaje y sentido.`,
    breakthroughFull: (sign: string) => `Urano en ${sign} marca el punto donde la carta necesita libertad, cambio e innovacion.`,
    dreamsFull: (sign: string) => `Neptuno en ${sign} abre la zona de la inspiracion, la sensibilidad, la espiritualidad y los limites difusos.`,
    transformationFull: (sign: string) => `Pluton en ${sign} senala donde hay intensidad, sombra, poder y procesos de muerte y renacimiento.`,
  };
}

export function getGeneralReadingCards(chart: NatalChartData, dictionary: Dictionary): GeneralReadingCard[] {
  const locale = localeFromDictionary(dictionary);
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
  const ascendantSign = dictionary.result.signs[formatSignPosition(chart.meta.ascendant).sign];
  const mcSign = dictionary.result.signs[formatSignPosition(chart.meta.mc).sign];
  const sunSign = sun ? dictionary.result.signs[sun.sign] : ascendantSign;
  const moonSign = moon ? dictionary.result.signs[moon.sign] : dictionary.result.signs.cancer;
  const venusSign = venus ? dictionary.result.signs[venus.sign] : dictionary.result.signs.libra;
  const mercurySign = mercury ? dictionary.result.signs[mercury.sign] : dictionary.result.signs.gemini;
  const marsSign = mars ? dictionary.result.signs[mars.sign] : dictionary.result.signs.aries;
  const jupiterSign = jupiter ? dictionary.result.signs[jupiter.sign] : dictionary.result.signs.sagittarius;
  const saturnSign = saturn ? dictionary.result.signs[saturn.sign] : dictionary.result.signs.capricorn;
  const uranusSign = uranus ? dictionary.result.signs[uranus.sign] : dictionary.result.signs.aquarius;
  const neptuneSign = neptune ? dictionary.result.signs[neptune.sign] : dictionary.result.signs.pisces;
  const plutoSign = pluto ? dictionary.result.signs[pluto.sign] : dictionary.result.signs.scorpio;
  const nodeSign = northNode ? dictionary.result.signs[northNode.sign] : mcSign;
  const southNodeSign = southNode ? dictionary.result.signs[southNode.sign] : dictionary.result.signs.libra;
  const chironSign = chiron ? dictionary.result.signs[chiron.sign] : dictionary.result.signs.aries;
  const moonHouse = moon?.house ?? 4;
  const fallback = fallbackCopy(dictionary);

  return [
    {
      id: "essence",
      theme: "tu-esencia",
      title: dictionary.result.generalReading.cards.essence.title,
      oneLiner: `${dictionary.result.generalReading.cards.essence.oneLiner} ${sunSign}.`,
      fullText: [
        fallback.essenceLead(sunSign),
        dictionary.result.generalReading.cards.essence.paragraphs[1],
      ],
    },
    {
      id: "feelings",
      theme: "como-sientes",
      title: dictionary.result.generalReading.cards.feelings.title,
      oneLiner: fallback.feelingsOne(moonSign, moonHouse),
      fullText:
        fallback.feelingsFull(moonSign, moonHouse),
    },
    {
      id: "love",
      theme: "que-das-valor",
      title: dictionary.result.generalReading.cards.love.title,
      oneLiner: `${dictionary.result.generalReading.cards.love.oneLiner} ${venusSign}.`,
      fullText: [
        fallback.loveLead(venusSign),
        dictionary.result.generalReading.cards.love.paragraphs[1],
      ],
    },
    {
      id: "mind",
      theme: "como-piensas",
      title: dictionary.result.generalReading.cards.mind.title,
      oneLiner: locale === "en"
        ? `${dictionary.result.generalReading.cards.mind.oneLiner} ${mercurySign} and house 3.`
        : locale === "it"
          ? `${dictionary.result.generalReading.cards.mind.oneLiner} ${mercurySign} e la casa 3.`
          : `${dictionary.result.generalReading.cards.mind.oneLiner} ${mercurySign} y la casa 3.`,
      fullText: [
        fallback.mindLead(mercurySign),
        dictionary.result.generalReading.cards.mind.paragraphs[1],
      ],
    },
    {
      id: "purpose",
      theme: "tu-proposito",
      title: dictionary.result.generalReading.cards.purpose.title,
      oneLiner: `${dictionary.result.generalReading.cards.purpose.oneLiner} ${mcSign} y ${nodeSign}.`,
      fullText: [
        fallback.purposeLead(mcSign, nodeSign),
        dictionary.result.generalReading.cards.purpose.paragraphs[1],
      ],
    },
    {
      id: "south-node",
      theme: "lo-que-suelto",
      title: fallback.southTitle,
      oneLiner: fallback.southOne(southNodeSign),
      fullText: fallback.southText(southNodeSign),
    },
    {
      id: "chiron",
      theme: "tu-herida-medicina",
      title: fallback.chironTitle,
      oneLiner: fallback.chironOne(chironSign),
      fullText: fallback.chironText(chironSign),
    },
    {
      id: "challenges",
      theme: "tus-desafios",
      title: dictionary.result.generalReading.cards.challenges.title,
      oneLiner: `${dictionary.result.generalReading.cards.challenges.oneLiner} ${saturnSign} y las tensiones activas.`,
      fullText: [
        fallback.challengesLead(saturnSign),
        dictionary.result.generalReading.cards.challenges.paragraphs[1],
      ],
    },
    {
      id: "ascendant",
      theme: "tu-ascendente",
      title: dictionary.result.generalReading.cards.ascendant.title,
      oneLiner: `${dictionary.result.generalReading.cards.ascendant.oneLiner} ${ascendantSign}.`,
      fullText: [
        fallback.ascLead(ascendantSign),
        dictionary.result.generalReading.cards.ascendant.paragraphs[1],
      ],
    },
    {
      id: "action",
      theme: "como-actuas",
      title: dictionary.result.generalReading.cards.action.title,
      oneLiner: `${dictionary.result.generalReading.cards.action.oneLiner} ${marsSign}.`,
      fullText: fallback.actionFull(marsSign),
    },
    {
      id: "growth",
      theme: "donde-creces",
      title: dictionary.result.generalReading.cards.growth.title,
      oneLiner: `${dictionary.result.generalReading.cards.growth.oneLiner} ${jupiterSign}.`,
      fullText: fallback.growthFull(jupiterSign),
    },
    {
      id: "breakthrough",
      theme: "donde-rompes-esquemas",
      title: dictionary.result.generalReading.cards.breakthrough.title,
      oneLiner: `${dictionary.result.generalReading.cards.breakthrough.oneLiner} ${uranusSign}.`,
      fullText: fallback.breakthroughFull(uranusSign),
    },
    {
      id: "dreams",
      theme: "donde-suenas",
      title: dictionary.result.generalReading.cards.dreams.title,
      oneLiner: `${dictionary.result.generalReading.cards.dreams.oneLiner} ${neptuneSign}.`,
      fullText: fallback.dreamsFull(neptuneSign),
    },
    {
      id: "transformation",
      theme: "donde-transformas",
      title: dictionary.result.generalReading.cards.transformation.title,
      oneLiner: `${dictionary.result.generalReading.cards.transformation.oneLiner} ${plutoSign}.`,
      fullText: fallback.transformationFull(plutoSign),
    },
  ];
}
