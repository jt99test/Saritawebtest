"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { ChartPoint, ChartPointId, HouseCusp, NatalChartData } from "@/lib/chart";
import {
  formatSignPosition,
  getApproachingHouseTransition,
  getApproachingSignTransition,
  getAugmentedChartPoints,
  getHouseForLongitude,
  getPointInterpretiveSign,
  getSignMeta,
  zodiacSigns,
} from "@/lib/chart";
import { getAspectLabel, getHouseArea, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { formatHouseWithTransition, formatSignWithTransition } from "@/components/chart/chart-helpers";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";
import type { SynastryAspect } from "@/lib/synastry";
import type { ActiveTransit } from "@/lib/transits.server";

export type BiWheelPanelVariant = "transits" | "solar-return" | "synastry";

type BiWheelInfoPanelProps = {
  variant: BiWheelPanelVariant;
  selectedId: ChartPointId | null;
  ring: "inner" | "outer";
  innerChart: NatalChartData;
  outerChart: NatalChartData | null;
  activeTransits?: ActiveTransit[];
  synastryAspects?: SynastryAspect[];
  innerName?: string;
  outerName?: string;
  onClose: () => void;
};

function useDesktopBreakpoint() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function selectedPoint(
  selectedId: ChartPointId | null,
  ring: "inner" | "outer",
  innerChart: NatalChartData,
  outerChart: NatalChartData | null,
) {
  if (!selectedId) {
    return null;
  }

  const chart = ring === "inner" ? innerChart : outerChart;
  return chart ? getAugmentedChartPoints(chart).find((point) => point.id === selectedId) ?? null : null;
}

function displayPointForPanel(
  variant: BiWheelPanelVariant,
  ring: "inner" | "outer",
  point: ChartPoint,
  innerChart: NatalChartData,
  outerChart: NatalChartData | null,
) {
  if (variant === "transits") {
    return {
      ...point,
      house: getHouseForLongitude(point.longitude, innerChart.houses),
    };
  }

  if (variant === "solar-return" && ring === "inner") {
    return {
      ...point,
      house: getHouseForLongitude(point.longitude, innerChart.houses),
    };
  }

  if (variant === "solar-return" && ring === "outer" && outerChart) {
    return {
      ...point,
      house: getHouseForLongitude(point.longitude, outerChart.houses),
    };
  }

  if (variant === "synastry") {
    return {
      ...point,
      house: getHouseForLongitude(point.longitude, innerChart.houses),
    };
  }

  return point;
}

function displayHousesForPanel(
  variant: BiWheelPanelVariant,
  ring: "inner" | "outer",
  innerChart: NatalChartData,
  outerChart: NatalChartData | null,
) {
  if (variant === "solar-return" && ring === "outer" && outerChart) {
    return outerChart.houses;
  }

  return innerChart.houses;
}

function displayHouseLabel(point: ChartPoint, houses: HouseCusp[]) {
  return formatHouseWithTransition({
    longitude: point.longitude,
    house: point.house,
    houses,
  });
}

function ringLabel(
  variant: BiWheelPanelVariant,
  ring: "inner" | "outer",
  copy: ReturnType<typeof panelCopy>,
  innerName?: string,
  outerName?: string,
) {
  if (variant === "transits") {
    return ring === "inner" ? copy.natal : copy.transitNow;
  }

  if (variant === "solar-return") {
    return ring === "inner" ? copy.natal : copy.solarReturn;
  }

  return ring === "inner" ? (innerName ?? copy.you) : (outerName ?? copy.partner);
}

function panelCopy(locale: string) {
  if (locale === "en") {
    return {
      natal: "Natal",
      transitNow: "Transit now",
      solarReturn: "SR this year",
      you: "You",
      partner: "Partner",
      noNatalTransits: "No active transits right now.",
      noTransitAspects: "No active aspects with your chart.",
      angularHouse: "Angular house - important position this year.",
      noSynastryAspects: "No direct aspects with this position.",
      sections: { reading: "Reading", essence: "Essence", data: "Data", connections: "Connections" },
      close: "Close",
    };
  }

  if (locale === "it") {
    return {
      natal: "Natale",
      transitNow: "Transito ora",
      solarReturn: "RS quest'anno",
      you: "Tu",
      partner: "Partner",
      noNatalTransits: "Nessun transito attivo ora.",
      noTransitAspects: "Nessun aspetto attivo con la tua carta.",
      angularHouse: "Casa angolare - posizione importante quest'anno.",
      noSynastryAspects: "Nessun aspetto diretto con questa posizione.",
      sections: { reading: "Lettura", essence: "Essenza", data: "Dati", connections: "Connessioni" },
      close: "Chiudi",
    };
  }

  return {
    natal: "Natal",
    transitNow: "Tránsito ahora",
    solarReturn: "RS Este Año",
    you: "Tú",
    partner: "Pareja",
    noNatalTransits: "Sin tránsitos activos ahora.",
    noTransitAspects: "Sin aspectos activos con tu carta.",
    angularHouse: "Casa angular - posición de peso este año.",
    noSynastryAspects: "Sin aspectos directos con esta posición.",
  };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d782]">
      {children}
    </p>
  );
}

function panelSectionLabels(locale: string) {
  if (locale === "en") {
    return { reading: "Reading", essence: "Essence", data: "Data", connections: "Connections", close: "Close" };
  }

  if (locale === "it") {
    return { reading: "Lettura", essence: "Essenza", data: "Dati", connections: "Connessioni", close: "Chiudi" };
  }

  return { reading: "Lectura", essence: "Esencia", data: "Datos", connections: "Conexiones", close: "Cerrar" };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#d7e7ff]/10 py-2.5 last:border-b-0">
      <dt className="text-[13px] text-[#d7e7ff]/66">{label}</dt>
      <dd className="text-right text-[13px] text-[#fffaf0]/88">{value}</dd>
    </div>
  );
}

function formatPointPosition(point: ChartPoint) {
  return `${point.degreeInSign}\u00b0 ${String(point.minutesInSign).padStart(2, "0")}\u2032`;
}

function formatAbsoluteLongitude(point: ChartPoint) {
  const degree = Math.floor(point.longitude);
  const minutes = Math.round((point.longitude - degree) * 60);
  return `${degree}\u00b0 ${String(minutes).padStart(2, "0")}\u2032`;
}

function pointRole(pointId: ChartPointId, locale: string) {
  const en: Partial<Record<ChartPointId, string>> = {
    sun: "shows identity, vitality, and conscious direction",
    moon: "describes emotional needs, bodily sensitivity, and safety",
    mercury: "organizes thinking, language, decisions, and learning",
    venus: "speaks about desire, pleasure, self-worth, and bonds",
    mars: "shows drive, direct energy, desire, and conflict",
    jupiter: "opens growth, confidence, meaning, and opportunity",
    saturn: "asks for structure, maturity, limits, and responsibility",
    uranus: "awakens change, freedom, pattern-breaking, and novelty",
    neptune: "sensitizes intuition, surrender, imagination, and blurred edges",
    pluto: "intensifies transformation, power, grief, and deep truth",
    northNode: "points to learning, evolutionary direction, and new ground",
    southNode: "shows memory, automatic responses, and familiar places",
    chiron: "touches old wounds, personal medicine, and sensitive learning",
    partOfFortune: "marks ease, natural resources, and available wellbeing",
    lilith: "names visceral autonomy, shadow, untamed desire, and boundaries",
    ceres: "speaks of care, nourishment, loss, and repair",
  };
  const it: Partial<Record<ChartPointId, string>> = {
    sun: "mostra identità, vitalità e direzione consapevole",
    moon: "descrive bisogni emotivi, sensibilità del corpo e sicurezza",
    mercury: "organizza pensiero, linguaggio, decisioni e apprendimento",
    venus: "parla di desiderio, piacere, valore personale e legami",
    mars: "mostra impulso, energia diretta, desiderio e conflitto",
    jupiter: "apre crescita, fiducia, senso e opportunità",
    saturn: "chiede struttura, maturità, limiti e responsabilità",
    uranus: "risveglia cambiamento, libertà, rottura degli schemi e novità",
    neptune: "rende più sensibili intuizione, resa, immaginazione e zone confuse",
    pluto: "intensifica trasformazione, potere, lutto e verità profonda",
    northNode: "indica apprendimento, direzione evolutiva e terreno nuovo",
    southNode: "mostra memoria, automatismi e luoghi conosciuti",
    chiron: "tocca ferite antiche, medicina personale e apprendimento sensibile",
    partOfFortune: "segna facilità, risorse naturali e benessere disponibile",
    lilith: "nomina autonomia viscerale, ombra, desiderio non addomesticato e limiti",
    ceres: "parla di cura, nutrimento, perdita e riparazione",
  };
  const es: Partial<Record<ChartPointId, string>> = {
    sun: "identidad, vitalidad, confianza y dirección consciente",
    moon: "necesidades emocionales, sensibilidad del cuerpo, hábitos y seguridad",
    mercury: "pensamiento, lenguaje, decisiones y aprendizaje",
    venus: "deseo, placer, valor propio, dinero, afecto y vínculos",
    mars: "impulso, energía, deseo directo y conflicto",
    jupiter: "crecimiento, confianza, sentido y oportunidades",
    saturn: "estructura, madurez, límites y responsabilidad",
    uranus: "cambio, libertad, ruptura de patrones y novedad",
    neptune: "intuición, entrega, imaginación y zonas difusas",
    pluto: "transformación, poder, duelo y verdad profunda",
    northNode: "aprendizaje, dirección evolutiva y terreno nuevo",
    southNode: "memoria, automatismos y lugares conocidos",
    chiron: "heridas antiguas, medicina propia y aprendizaje sensible",
    partOfFortune: "marca facilidad, recursos naturales y bienestar disponible",
    lilith: "autonomía visceral, sombra, deseo no domesticado y límites",
    ceres: "cuidado, nutrición, pérdida y reparación",
  };

  const roles = locale === "en" ? en : locale === "it" ? it : es;
  return roles[pointId] ?? (locale === "en" ? "describes an important chart function" : locale === "it" ? "descrive una funzione importante della carta" : "describe una funcion importante dentro de la carta");
}

function signTone(sign: string, locale: string) {
  const en: Record<string, string> = {
    aries: "acts quickly, seeks initiative, and does not wait for too much validation",
    taurus: "needs body, consistency, and choices that can be sustained",
    gemini: "moves through conversations, ideas, questions, and changes of focus",
    cancer: "passes through care, memory, family, and what creates safety",
    leo: "asks for expression, healthy pride, visibility, and heart",
    virgo: "orders, corrects, improves habits, and makes things practical",
    libra: "activates through bonds, agreements, aesthetics, and shared choices",
    scorpio: "intensifies, reveals what is hidden, and asks for emotional honesty",
    sagittarius: "opens perspective, movement, study, travel, or a wider truth",
    capricorn: "requires structure, maturity, strategy, and real commitment",
    aquarius: "breaks inertia and seeks air, difference, and freer action",
    pisces: "sensitizes, dissolves defenses, and asks for inner listening",
  };
  const it: Record<string, string> = {
    aries: "agisce in fretta, cerca iniziativa e non aspetta troppa conferma",
    taurus: "ha bisogno di corpo, costanza e scelte sostenibili",
    gemini: "si muove attraverso conversazioni, idee, dubbi e cambi di focus",
    cancer: "passa dalla cura, dalla memoria, dalla famiglia e da ciò che dà sicurezza",
    leo: "chiede espressione, orgoglio sano, visibilità e cuore",
    virgo: "ordina, corregge, migliora abitudini e porta tutto nel pratico",
    libra: "si attiva nei legami, negli accordi, nell'estetica e nelle decisioni condivise",
    scorpio: "intensifica, rivela il nascosto e chiede onestà emotiva",
    sagittarius: "apre prospettiva, movimento, studio, viaggio o una verità più ampia",
    capricorn: "esige struttura, maturità, strategia e impegno reale",
    aquarius: "rompe inerzie e cerca aria, differenza e un modo più libero di agire",
    pisces: "sensibilizza, scioglie difese e chiede ascolto interiore",
  };
  const es: Record<string, string> = {
    aries: "actúa rápido, busca iniciativa y no espera demasiada validación",
    taurus: "necesita cuerpo, constancia y decisiones que se puedan sostener",
    gemini: "se mueve a través de conversaciones, ideas, dudas y cambios de enfoque",
    cancer: "pasa por el cuidado, la memoria, la familia y lo que da seguridad",
    leo: "pide expresión, orgullo sano, visibilidad y corazón en lo que se hace",
    virgo: "ordena, corrige, mejora hábitos y baja todo a lo práctico",
    libra: "se activa en vínculos, acuerdos, estética y decisiones compartidas",
    scorpio: "intensifica, revela lo oculto y pide honestidad emocional",
    sagittarius: "abre perspectiva, movimiento, estudio, viaje o una verdad más amplia",
    capricorn: "exige estructura, madurez, estrategia y compromiso real",
    aquarius: "rompe inercias, busca aire, diferencia y una forma mas libre de actuar",
    pisces: "sensibiliza, disuelve defensas y pide escucha interna",
  };

  const tones = locale === "en" ? en : locale === "it" ? it : es;
  return tones[sign] ?? (locale === "en" ? "takes on the tone of the sign" : locale === "it" ? "prende il tono del segno" : "toma un tono particular según el signo");
}

function houseAction(house: number, locale: string) {
  const en: Record<number, string> = {
    1: "it shows in identity, body, presence, and choices that put you first",
    2: "it plays out through money, self-worth, material safety, and concrete confidence",
    3: "it appears in conversations, study, siblings, short movement, and thinking style",
    4: "it moves home, family, emotional roots, and the need for privacy",
    5: "it lights up desire, creativity, romance, pleasure, and self-expression",
    6: "it organizes routine, health, daily work, and how you protect your energy",
    7: "it manifests through partnership, agreements, clients, and important mirrors",
    8: "it touches intimacy, trust, grief, debt, desire, and shared power",
    9: "it opens study, travel, beliefs, meaning, and bigger horizons",
    10: "it becomes visible in career, reputation, public goals, and responsibility",
    11: "it activates friendships, networks, collective projects, and the future",
    12: "it works through rest, closure, the unconscious, solitude, and release",
  };
  const it: Record<number, string> = {
    1: "si vede in identità, corpo, presenza e scelte che ti mettono al primo posto",
    2: "si gioca in denaro, valore personale, sicurezza materiale e autostima concreta",
    3: "appare in conversazioni, studio, fratelli, spostamenti brevi e modo di pensare",
    4: "muove casa, famiglia, radici emotive e bisogno di intimità",
    5: "accende desiderio, creatività, amori, piacere e voglia di esporti",
    6: "ordina routine, salute, lavoro quotidiano e cura dell'energia",
    7: "si manifesta in coppia, accordi, clienti e specchi importanti",
    8: "tocca intimità, fiducia, lutti, debiti, desiderio e potere condiviso",
    9: "apre studi, viaggi, credenze, senso e orizzonti più ampi",
    10: "si vede in carriera, reputazione, obiettivi pubblici e responsabilità",
    11: "si attiva in amicizie, reti, progetti collettivi e futuro",
    12: "lavora in riposo, chiusure, inconscio, solitudine e ciò che va lasciato",
  };
  const es: Record<number, string> = {
    1: "se nota en identidad, cuerpo, presencia y decisiones que te ponen primero",
    2: "se juega en dinero, valor propio, seguridad material y autoestima concreta",
    3: "aparece en conversaciones, estudios, hermanos, traslados cortos y forma de pensar",
    4: "mueve hogar, familia, raíz emocional y necesidad de intimidad",
    5: "enciende deseo, creatividad, romances, placer y ganas de jugarte por algo",
    6: "ordena rutina, salud, trabajo diario y la manera de cuidar tu energía",
    7: "se manifiesta en pareja, acuerdos, clientes y espejos importantes",
    8: "toca intimidad, confianza, duelos, deudas, deseo y poder compartido",
    9: "abre estudios, viajes, creencias, sentido y decisiones de horizonte",
    10: "se ve en carrera, reputación, metas públicas y responsabilidad",
    11: "se activa en amistades, redes, proyectos colectivos y futuro",
    12: "trabaja en descanso, cierre, inconsciente, soledad y lo que necesitas soltar",
  };

  const actions = locale === "en" ? en : locale === "it" ? it : es;
  return actions[house] ?? (locale === "en" ? `it manifests in house ${house}` : locale === "it" ? `si manifesta nella casa ${house}` : `se manifiesta en la casa ${house}`);
}

function biWheelReading({
  variant,
  ring,
  point,
  copy,
  innerName,
  outerName,
  locale,
}: {
  variant: BiWheelPanelVariant;
  ring: "inner" | "outer";
  point: ChartPoint;
  copy: ReturnType<typeof panelCopy>;
  innerName?: string;
  outerName?: string;
  locale: string;
}) {
  const planet = getPointLabel(point.id, locale);
  const sign = getSignLabel(point.sign, locale);
  const area = houseAction(point.house, locale);
  const role = pointRole(point.id, locale);
  const owner = ring === "inner" ? (innerName ?? copy.you) : (outerName ?? copy.partner);
  const tone = signTone(point.sign, locale);

  if (locale === "en") {
    if (variant === "solar-return") {
      return ring === "outer"
        ? `${planet} in the Solar Return marks a live scene for this year: it ${role}. In ${sign}, it ${tone}; in house ${point.house}, ${area}. In practice, this shows where the year asks you to act differently, make a more conscious choice, or stop leaving something on autopilot.`
        : `${planet} in the natal chart is a stable part of you: it ${role}. When the Solar Return touches it, the year does not invent a new topic; it wakes one up. This can feel like a call to review how you use that energy in house ${point.house}, where ${area}.`;
    }

    if (variant === "transits") {
      return ring === "outer"
        ? `${planet} by transit is moving the current weather: it ${role}. In ${sign}, it ${tone}; in house ${point.house}, ${area}. If this planet aspects a natal point, that is where the event shows up: a conversation, pressure, an opening, or a decision that makes you respond differently.`
        : `${planet} in the natal chart is the sensitive point receiving outside movement now. It ${role}. If a transit aspects it, this function becomes more visible: you may react more strongly, adjust habits, or see clearly what had become normal in house ${point.house}, where ${area}.`;
    }

    return ring === "outer"
      ? `${planet} from ${owner} brings this function into the bond: it ${role}. In ${sign}, it ${tone}; falling in house ${point.house}, it can touch themes where ${area}. Strong aspects mean this person does not just "influence" you; they wake a concrete response, whether attraction, friction, learning, or negotiation.`
      : `${planet} from ${owner} shows a part of you the other person can activate easily. It ${role}. In synastry, when their planets touch this point, the bond becomes daily experience: it moves you in house ${point.house}, where ${area}, and shows what pattern repeats or what new response you can try.`;
  }

  if (locale === "it") {
    if (variant === "solar-return") {
      return ring === "outer"
        ? `${planet} nella Rivoluzione Solare segna una scena viva dell'anno: ${role}. In ${sign}, ${tone}; in casa ${point.house}, ${area}. In pratica, mostra dove l'anno ti chiede di agire diversamente, scegliere con più coscienza o non lasciare qualcosa in automatico.`
        : `${planet} natale è una parte stabile della tua carta: ${role}. Quando la Rivoluzione Solare lo tocca, l'anno non inventa un tema nuovo, lo risveglia. Può sembrare una chiamata a rivedere come usi questa energia in casa ${point.house}, dove ${area}.`;
    }

    if (variant === "transits") {
      return ring === "outer"
        ? `${planet} in transito sta muovendo il clima attuale: ${role}. In ${sign}, ${tone}; in casa ${point.house}, ${area}. Se questo pianeta aspetta un punto natale, lì si vede l'evento: una conversazione, una tensione, un'apertura o una decisione che ti fa rispondere diversamente.`
        : `${planet} natale è il punto sensibile che ora riceve movimento esterno. ${role}. Se un transito lo aspetta, questa funzione diventa più visibile: puoi reagire più forte, aggiustare abitudini o vedere chiaramente qualcosa che era diventato normale in casa ${point.house}, dove ${area}.`;
    }

    return ring === "outer"
      ? `${planet} di ${owner} porta questa funzione nel legame: ${role}. In ${sign}, ${tone}; cadendo in casa ${point.house}, può toccare temi dove ${area}. Con aspetti forti, questa persona non "influenza" soltanto: risveglia una risposta concreta, tra attrazione, frizione, apprendimento o negoziazione.`
      : `${planet} di ${owner} mostra una zona tua che l'altra persona può attivare facilmente. ${role}. In sinastria, quando i suoi pianeti toccano questo punto, il legame diventa esperienza quotidiana: ti muove in casa ${point.house}, dove ${area}, e mostra quale schema ripeti o quale risposta nuova puoi provare.`;
  }

  if (variant === "solar-return") {
    return ring === "outer"
      ? `${planet} de la Revolución Solar marca una escena viva del año: activa ${role}. En ${sign}, ${tone}; en casa ${point.house}, ${area}. En la práctica, esta posición muestra dónde el año te pide actuar distinto, tomar una decisión más consciente o atender algo que ya no puede quedar en automático.`
      : `${planet} natal es una parte estable de tu carta vinculada con ${role}. Cuando la Revolución Solar lo toca, el año no inventa un tema nuevo: lo despierta. Esta activación puede sentirse como una llamada a revisar cómo usas esa energía en casa ${point.house}, donde ${area}.`;
  }

  if (variant === "transits") {
    return ring === "outer"
      ? `${planet} en tránsito está moviendo el clima actual a través de ${role}. En ${sign}, ${tone}; en casa ${point.house}, ${area}. Si este planeta toca un punto natal, ahí se nota el evento: una conversación, una tensión, una oportunidad o una decisión que te hace responder de otra manera.`
      : `${planet} natal es el punto de tu carta que ahora recibe presión o movimiento externo. Habla de ${role}. Si un tránsito lo aspecta, esa función se vuelve más visible: puedes reaccionar con más intensidad, ajustar hábitos o ver claro algo que antes estaba normalizado en casa ${point.house}, donde ${area}.`;
  }

  return ring === "outer"
    ? `${planet} de ${owner} trae al vínculo temas de ${role}. En ${sign}, ${tone}; al caer en casa ${point.house}, puede tocar en ti situaciones donde ${area}. Si hay aspectos fuertes, esta persona no solo "influye": despierta una reacción concreta, ya sea atracción, fricción, aprendizaje o necesidad de negociar.`
    : `${planet} de ${owner} muestra una zona tuya que la otra persona puede activar con facilidad: ${role}. En sinastría, cuando sus planetas tocan este punto, el vínculo se vuelve experiencia cotidiana: te mueve en casa ${point.house}, donde ${area}, y te muestra qué patrón repites o qué respuesta nueva puedes ensayar.`;
}

function TransitRows({
  ring,
  selectedId,
  copy,
  locale,
  activeTransits = [],
}: {
  ring: "inner" | "outer";
  selectedId: ChartPointId;
  copy: ReturnType<typeof panelCopy>;
  locale: string;
  activeTransits?: ActiveTransit[];
}) {
  const rows = activeTransits
    .filter((transit) => (ring === "inner" ? transit.natalPlanet === selectedId : transit.transitingPlanet === selectedId))
    .slice(0, 3);

  if (!rows.length) {
    return (
      <p className="text-[13px] text-[#d7e7ff]/66">
        {ring === "inner" ? copy.noNatalTransits : copy.noTransitAspects}
      </p>
    );
  }

  return (
    <div>
      {rows.map((transit) => {
        const lifecycleLabel = lifecycleTransitLabel(transit, locale);
        const rowLabel = lifecycleLabel || (ring === "inner"
          ? `${getPointLabel(transit.transitingPlanet, locale)} ${getAspectLabel(transit.aspectType, locale).toLowerCase()}`
          : `${getAspectLabel(transit.aspectType, locale)} ${getPointLabel(transit.natalPlanet, locale)} natal`);

        return (
          <div
            key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}`}
            className="flex items-center justify-between gap-4 border-b border-[#d7e7ff]/10 py-2.5 last:border-b-0"
          >
            <p className="text-[13px] text-[#fffaf0]/86">{rowLabel}</p>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#f5d782]">
              {transit.orb.toFixed(1)}°
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SolarReturnNote({ point, copy, locale }: { point: ChartPoint; copy: ReturnType<typeof panelCopy>; locale: string }) {
  const angular = point.house === 1 || point.house === 4 || point.house === 7 || point.house === 10;
  return (
    <p className={angular ? "text-[13px] italic text-[#f5d782]" : "text-[13px] italic text-[#d7e7ff]/66"}>
      {angular ? copy.angularHouse : getHouseArea(point.house, locale)}
    </p>
  );
}

function qualityLabel(quality: SynastryAspect["quality"], locale: string) {
  if (quality === "harmonious" && locale === "en") {
    return { label: "Harmonious", className: "text-[#7cbfff]" };
  }

  if (quality === "harmonious" && locale === "it") {
    return { label: "Armonico", className: "text-[#7cbfff]" };
  }

  if (quality === "harmonious") {
    return { label: "Armónico", className: "text-[#7cbfff]" };
  }

  if (quality === "tense") {
    return { label: locale === "en" ? "Tense" : locale === "it" ? "Teso" : "Tenso", className: "text-red-700" };
  }

  return { label: locale === "en" ? "Neutral" : "Neutro", className: "text-[#8a7a4e]" };
}

function lifecycleTransitLabel(transit: Pick<ActiveTransit, "lifecycleEvent">, locale: string) {
  if (!transit.lifecycleEvent) return "";
  const labels: Record<NonNullable<ActiveTransit["lifecycleEvent"]>, Record<"es" | "en" | "it", string>> = {
    "jupiter-return": { es: "Retorno de Júpiter", en: "Jupiter return", it: "Ritorno di Giove" },
    "jupiter-opposition": { es: "Oposición de Júpiter", en: "Jupiter opposition", it: "Opposizione di Giove" },
    "saturn-return": { es: "Retorno de Saturno", en: "Saturn return", it: "Ritorno di Saturno" },
    "saturn-opposition": { es: "Oposición de Saturno", en: "Saturn opposition", it: "Opposizione di Saturno" },
    "uranus-return": { es: "Retorno de Urano", en: "Uranus return", it: "Ritorno di Urano" },
    "uranus-opposition": { es: "Oposición de Urano", en: "Uranus opposition", it: "Opposizione di Urano" },
  };
  const language = locale === "en" || locale === "it" ? locale : "es";
  return labels[transit.lifecycleEvent][language];
}

function SynastryRows({
  ring,
  selectedId,
  copy,
  locale,
  synastryAspects = [],
}: {
  ring: "inner" | "outer";
  selectedId: ChartPointId;
  copy: ReturnType<typeof panelCopy>;
  locale: string;
  synastryAspects?: SynastryAspect[];
}) {
  const rows = synastryAspects
    .filter((aspect) => (ring === "inner" ? aspect.pointA === selectedId : aspect.pointB === selectedId))
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 3);

  if (!rows.length) {
    return <p className="text-[13px] text-[#d7e7ff]/66">{copy.noSynastryAspects}</p>;
  }

  return (
    <div>
      {rows.map((aspect) => {
        const badge = qualityLabel(aspect.quality, locale);
        const otherPoint = ring === "inner" ? aspect.pointB : aspect.pointA;
        return (
          <div
            key={`${aspect.pointA}-${aspect.pointB}-${aspect.type}`}
            className="flex items-center justify-between gap-4 border-b border-[#d7e7ff]/10 py-2.5 last:border-b-0"
          >
            <p className="text-[13px] text-[#fffaf0]/86">
              {getAspectLabel(aspect.type, locale)} {getPointLabel(otherPoint, locale)} · {aspect.orb.toFixed(1)}°
            </p>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BiWheelInfoPanel({
  variant,
  selectedId,
  ring,
  innerChart,
  outerChart,
  activeTransits,
  synastryAspects,
  innerName,
  outerName,
  onClose,
}: BiWheelInfoPanelProps) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const copy = panelCopy(locale);
  const sectionCopy = panelSectionLabels(locale);
  const isDesktop = useDesktopBreakpoint();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const point = selectedPoint(selectedId, ring, innerChart, outerChart);
  const displayPoint = point ? displayPointForPanel(variant, ring, point, innerChart, outerChart) : null;
  const displayHouses = displayHousesForPanel(variant, ring, innerChart, outerChart);

  useEffect(() => {
    if (!selectedId || !point) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || panelRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, point, selectedId]);

  const readingSign = displayPoint ? getPointInterpretiveSign(displayPoint) : null;
  const signTransition = displayPoint ? getApproachingSignTransition({ longitude: displayPoint.longitude }) : null;
  const signMeta = readingSign ? getSignMeta(readingSign) : null;
  const signGlyph = displayPoint ? zodiacSigns.find((sign) => sign.id === displayPoint.sign)?.glyph ?? "" : "";
  const signLabel = displayPoint && readingSign ? formatSignWithTransition({
    longitude: displayPoint.longitude,
    signLabel: getSignLabel(displayPoint.sign, locale),
    nextSignLabel: getSignLabel(readingSign, locale),
  }) : "";
  const position = displayPoint ? formatSignPosition(displayPoint.longitude) : null;
  const transition = displayPoint ? getApproachingHouseTransition({
    longitude: displayPoint.longitude,
    house: displayPoint.house,
    houses: displayHouses,
  }) : null;
  const readingHouse = displayPoint?.house ?? null;
  const readingPoint = displayPoint && readingHouse && readingSign ? { ...displayPoint, house: readingHouse, sign: readingSign } : displayPoint;
  const reading = readingPoint ? biWheelReading({ variant, ring, point: readingPoint, copy, innerName, outerName, locale }) : "";
  const houseLabel = displayPoint ? displayHouseLabel(displayPoint, displayHouses) : "";
  const houseNote = transition
    ? dictionary.result.messages.houseTransitionNote.replace("{house}", String(transition.nextHouse))
    : null;
  const signNote = signTransition
    ? dictionary.result.messages.signTransitionNote.replace("{sign}", getSignLabel(signTransition.nextSign, locale))
    : null;

  return (
    <AnimatePresence>
      {selectedId && point && displayPoint ? (
        <>
        {!isDesktop ? (
          <button
            type="button"
            aria-label={sectionCopy.close}
            onClick={onClose}
            className="fixed inset-x-0 top-0 z-30 h-[28vh] bg-black/0"
          />
        ) : null}
        <motion.aside
          key={`${ring}-${selectedId}`}
          initial={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={isDesktop ? { x: "100%", opacity: 0.92 } : { y: "100%", opacity: 0.92 }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className={[
            "fixed z-40 overflow-y-auto border-[#d7e7ff]/12 bg-[#061331]/95 backdrop-blur-[16px]",
            isDesktop
              ? "right-4 top-[104px] h-[calc(100vh-120px)] w-[360px] rounded-[1.4rem] border shadow-[-18px_18px_70px_rgba(0,0,0,0.28)]"
              : "inset-x-0 bottom-0 h-[min(76svh,calc(100svh-4.5rem))] rounded-t-[1.5rem] border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_90px_rgba(0,0,0,0.32)]",
          ].join(" ")}
          role="dialog"
          aria-label={dictionary.result.points[selectedId]}
        >
          <div ref={panelRef} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="notranslate text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]" translate="no">
                  {ringLabel(variant, ring, copy, innerName, outerName)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-serif text-[2rem] leading-none" style={{ color: displayPoint.color }}>
                    {displayPoint.glyph}
                  </span>
                  <div>
                    <h3 className="font-serif text-[22px] leading-none text-ivory">
                      {dictionary.result.points[selectedId]}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-[#d7e7ff]/66">
                      {signLabel} · {dictionary.result.transitPage.housePrefix} {houseLabel} · {getHouseArea(readingHouse ?? displayPoint.house, locale)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#d7e7ff]/16 bg-[#d7e7ff]/8 p-2.5 text-[#fffaf0]/70 transition hover:border-[#f5d782]/45 hover:bg-[#f5d782]/10 hover:text-[#fffaf0]"
                aria-label={sectionCopy.close}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-5 border-t border-[#d7e7ff]/10 pt-5">
              {houseNote ? (
                <p className="rounded-[1rem] border border-[#f5d782]/22 bg-[#f5d782]/10 px-3 py-2 text-xs leading-6 text-[#d7e7ff]/78">
                  {houseNote}
                </p>
              ) : null}
              {signNote ? (
                <p className="rounded-[1rem] border border-[#f5d782]/22 bg-[#f5d782]/10 px-3 py-2 text-xs leading-6 text-[#d7e7ff]/78">
                  {signNote}
                </p>
              ) : null}
              <section className="rounded-[1.45rem] border border-[#d7e7ff]/12 bg-[#d7e7ff]/7 p-4">
                <SectionLabel>{sectionCopy.reading}</SectionLabel>
                <p className="mt-3 text-sm leading-7 text-[#fffaf0]/78">{reading}</p>
              </section>

              <section className="rounded-[1.45rem] border border-[#d7e7ff]/12 bg-[#d7e7ff]/7 p-4">
                <SectionLabel>{sectionCopy.essence}</SectionLabel>
                {signMeta ? (
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[#fffaf0]/78">
                    <li className="flex gap-2">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-ivory/35" />
                      <span>{signLabel}{" \u00b7 "}{dictionary.result.elements[signMeta.element]}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-ivory/35" />
                      <span>{dictionary.result.editorial.signPrompts[readingSign ?? displayPoint.sign]}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-ivory/35" />
                      <span>{dictionary.result.transitPage.housePrefix} {houseLabel}{" \u00b7 "}{getHouseArea(readingHouse ?? displayPoint.house, locale)}</span>
                    </li>
                  </ul>
                ) : null}
              </section>

              <section className="rounded-[1.45rem] border border-[#d7e7ff]/12 bg-[#d7e7ff]/7 p-4">
                <SectionLabel>{sectionCopy.data}</SectionLabel>
                {position && signMeta ? (
                  <dl className="mt-3">
                    <InfoRow label={dictionary.result.fields.position} value={formatPointPosition(displayPoint)} />
                    <InfoRow
                      label={dictionary.result.fields.zodiacPosition}
                      value={`${position.degreeInSign}\u00b0 ${String(position.minutesInSign).padStart(2, "0")}\u2032 ${signGlyph}`}
                    />
                    <InfoRow label={dictionary.result.fields.eclipticLongitude} value={formatAbsoluteLongitude(displayPoint)} />
                    <InfoRow label={dictionary.result.fields.sign} value={signLabel} />
                    <InfoRow label={dictionary.result.fields.house} value={houseLabel} />
                    <InfoRow label={dictionary.result.fields.element} value={dictionary.result.elements[signMeta.element]} />
                    <InfoRow label={dictionary.result.fields.modality} value={dictionary.result.modalities[signMeta.modality]} />
                    <InfoRow label={dictionary.result.fields.retrograde} value={displayPoint.retrograde ? dictionary.common.yes : dictionary.common.no} />
                  </dl>
                ) : null}
              </section>

              <section className="rounded-[1.45rem] border border-[#d7e7ff]/12 bg-[#d7e7ff]/7 p-4">
                <SectionLabel>{sectionCopy.connections}</SectionLabel>
                <div className="mt-3">
              {variant === "transits" ? (
                <TransitRows ring={ring} selectedId={selectedId} copy={copy} locale={locale} activeTransits={activeTransits} />
              ) : null}
              {variant === "solar-return" && readingPoint ? <SolarReturnNote point={readingPoint} copy={copy} locale={locale} /> : null}
              {variant === "synastry" ? (
                <SynastryRows ring={ring} selectedId={selectedId} copy={copy} locale={locale} synastryAspects={synastryAspects} />
              ) : null}
                </div>
              </section>
            </div>
          </div>
        </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
