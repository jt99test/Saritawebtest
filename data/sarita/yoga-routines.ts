import { asanaImages } from "./asana-image-mapping";
import { elementRoutines as legacyElementRoutines } from "./element-routines";

export type Asana = {
  slug: string;
  element: ElementRoutine["element"];
  nameSanskrit: string;
  nameSpanish: string;
  description: string;
  duration: string;
  warning: string;
  imagePath: string | null;
};

export type Pranayama = {
  name: string;
  description: string;
  contraindications?: string;
};

export type SignAndCase = {
  sign: string;
  houseNumber: number;
  description: string;
};

export type ElementRoutine = {
  element: "fuego" | "tierra" | "agua" | "aire";
  title: string;
  bodyZone: string;
  planets: string[];
  signs: string[];
  houses: number[];
  chakra: { name: string; mantra: string };
  intention: string;
  signsAndHouses: SignAndCase[];
  asanas: Asana[];
  pranayama: Pranayama[];
  savasana: { duration: string; visualization: string };
  totalDuration: string;
};

const mojibakePattern = /[\u00C3\u00C2\u00E2]/;

const decodeMojibake = (value: string): string => {
  if (!mojibakePattern.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8").decode(
      Uint8Array.from(value, (character) => character.charCodeAt(0)),
    );
  } catch {
    return value;
  }
};

const normalizeText = (value: string): string =>
  decodeMojibake(value).replace(/\s+\u00B7\s+/g, " · ").trim();

const slugify = (value: string): string =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleByElement: Record<ElementRoutine["element"], string> = {
  fuego: "Elemento Fuego",
  tierra: "Elemento Tierra",
  agua: "Elemento Agua",
  aire: "Elemento Aire",
};

const imageSlugOverrides: Record<string, string> = {
  "Anjaneyasana Profundo": "anjaneyasana",
  "Baddha Konasana con Oscilación": "baddha-konasana",
  "Setu Bandhasana con Respiración Expansiva": "setu-bandhasana",
  "Upavista Konasana con Movimiento": "upavista-konasana",
};

const ASANA_WARNINGS: Record<string, string> = {
  tadasana: "Evita bloquear las rodillas. Si hay mareo, baja la intensidad y practica cerca de una pared.",
  navasana: "No fuerces si hay dolor lumbar, hernia abdominal o embarazo. Mantén rodillas flexionadas si el abdomen tiembla demasiado.",
  "ardha-navasana": "Evita esta variante con dolor lumbar agudo, diástasis abdominal o embarazo avanzado. Sal antes de perder la respiración.",
  salabhasana: "No practiques si hay dolor lumbar agudo, lesión cervical o embarazo. Eleva poco y mantén el cuello largo.",
  dhanurasana: "Evita con embarazo, dolor lumbar, hernia, hipertensión no controlada o molestias fuertes en rodillas.",
  "parivrtta-janu-sirsasana": "Practica suave si hay lesión de isquiotibiales, sacroilíaca o espalda baja. No colapses el costado.",
  "parivrtta-trikonasana": "Usa bloque si hay tensión lumbar o isquiotibiales. Evita torsiones profundas en embarazo.",
  ustrasana: "Protege lumbares y cuello. Evita si hay vértigo, migraña activa, lesión cervical o dolor lumbar agudo.",
  "mula-bandha": "Contrae de forma sutil. Evita sostener tensión si hay dolor pélvico, posparto reciente o recuperación de cirugía.",
  malasana: "Eleva talones con soporte si molestan tobillos o rodillas. Evita la profundidad si hay lesión de cadera o rodilla.",
  balasana: "Separa rodillas o usa soporte si hay molestias en rodillas, caderas o embarazo. No comprimas el abdomen.",
  "marjaryasana-bitilasana": "Mantén el movimiento suave si hay lesión de muñecas, hombros o cuello. Apoya antebrazos si hace falta.",
  "setu-bandhasana": "Evita empujar desde el cuello. Practica bajo si hay dolor lumbar, cervical o presión alta no controlada.",
  "supta-baddha-konasana": "Sostén las rodillas con cojines si hay tensión de ingles, rodillas o caderas. No fuerces la apertura.",
  paschimottanasana: "Dobla rodillas si hay tirón lumbar o de isquiotibiales. Evita redondear agresivamente la espalda.",
  "prasarita-padottanasana": "Evita bajar la cabeza si hay glaucoma, vértigo o hipertensión no controlada. Usa soporte bajo las manos.",
  "virabhadrasana-i": "Ajusta la distancia si hay dolor de rodilla, cadera o sacroilíaca. Mantén la rodilla frontal estable.",
  "flujo-pelvico-libre": "Muévete lento si hay dolor pélvico, embarazo avanzado o mareo. Evita rangos que pinchen la zona lumbar.",
  anjaneyasana: "Acolcha la rodilla de atrás. Evita hundir la pelvis si hay dolor lumbar, pubalgia o lesión de cadera.",
  "baddha-konasana": "No empujes las rodillas hacia abajo. Usa soporte si hay molestias en ingles, caderas o rodillas.",
  "upavista-konasana": "Mantén rodillas ligeramente flexionadas si tiran los isquiotibiales. Evita con dolor sacroilíaco activo.",
  "ardha-matsyendrasana": "Evita torsiones profundas en embarazo o hernia discal. Gira desde la columna larga, no desde el cuello.",
  "supta-kapotasana": "Mantén el pie flexionado y evita si hay dolor de rodilla. Aleja las piernas si la cadera se irrita.",
  "viparita-karani": "Evita si hay glaucoma, hipertensión no controlada o molestias al estar invertida. Sal despacio.",
  "movimiento-libre-final": "Mantén movimientos pequeños si hay mareo, dolor articular o fatiga. La libertad no necesita intensidad.",
  "apertura-toracica-en-cuatro-apoyos": "Apoya antebrazo o manta si hay dolor de muñeca. No fuerces la rotación si hay lesión de hombro.",
  anahatasana: "Protege hombros y cuello. Usa soporte bajo el pecho si hay pinzamiento, dolor cervical o embarazo avanzado.",
  "bhujangasana-bajo": "No bloquees codos ni comprimas lumbares. Evita con embarazo avanzado o dolor lumbar agudo.",
  "gomukhasana-brazos": "Usa correa si los hombros no llegan. Evita tirar si hay lesión de manguito rotador o cuello.",
  garudasana: "Practica cerca de una pared si hay problemas de equilibrio. Evita cerrar demasiado si duelen rodillas u hombros.",
  camatkarasana: "Evita si hay lesión de muñeca, hombro o lumbar. Mantén la transición lenta y sal si pierdes estabilidad.",
  matsyasana: "El peso no va en la cabeza. Evita con lesión cervical, migraña activa o vértigo.",
  "setu-bandhasana-con-respiracion-expansiva": "Mantén el cuello neutro y evita forzar el pecho si hay dolor lumbar, cervical o presión alta.",
  "balasana-con-brazos-abiertos": "Ajusta brazos y rodillas si hay molestias en hombros, rodillas o caderas. Usa soporte bajo el torso.",
};

const getImageSlug = (nameSanskrit: string): string => {
  const normalized = normalizeText(nameSanskrit);
  return imageSlugOverrides[normalized] ?? slugify(normalized);
};

export const yogaRoutines: Record<
  "fuego" | "tierra" | "agua" | "aire",
  ElementRoutine
> = {
  fuego: {
    element: "fuego",
    title: titleByElement.fuego,
    bodyZone: normalizeText(legacyElementRoutines.fuego.bodyZone),
    planets: legacyElementRoutines.fuego.planets.map(normalizeText),
    signs: legacyElementRoutines.fuego.signs.map(normalizeText),
    houses: [...legacyElementRoutines.fuego.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.fuego.chakra.name),
      mantra: normalizeText(legacyElementRoutines.fuego.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.fuego.intention),
    signsAndHouses: legacyElementRoutines.fuego.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.fuego.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit);

      return {
        slug,
        element: "fuego",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.fuego.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.fuego.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.fuego.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.fuego.totalDuration),
  },
  tierra: {
    element: "tierra",
    title: titleByElement.tierra,
    bodyZone: normalizeText(legacyElementRoutines.tierra.bodyZone),
    planets: legacyElementRoutines.tierra.planets.map(normalizeText),
    signs: legacyElementRoutines.tierra.signs.map(normalizeText),
    houses: [...legacyElementRoutines.tierra.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.tierra.chakra.name),
      mantra: normalizeText(legacyElementRoutines.tierra.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.tierra.intention),
    signsAndHouses: legacyElementRoutines.tierra.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.tierra.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit);

      return {
        slug,
        element: "tierra",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.tierra.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.tierra.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.tierra.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.tierra.totalDuration),
  },
  agua: {
    element: "agua",
    title: titleByElement.agua,
    bodyZone: normalizeText(legacyElementRoutines.agua.bodyZone),
    planets: legacyElementRoutines.agua.planets.map(normalizeText),
    signs: legacyElementRoutines.agua.signs.map(normalizeText),
    houses: [...legacyElementRoutines.agua.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.agua.chakra.name),
      mantra: normalizeText(legacyElementRoutines.agua.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.agua.intention),
    signsAndHouses: legacyElementRoutines.agua.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.agua.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit);

      return {
        slug,
        element: "agua",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.agua.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.agua.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.agua.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.agua.totalDuration),
  },
  aire: {
    element: "aire",
    title: titleByElement.aire,
    bodyZone: normalizeText(legacyElementRoutines.aire.bodyZone),
    planets: legacyElementRoutines.aire.planets.map(normalizeText),
    signs: legacyElementRoutines.aire.signs.map(normalizeText),
    houses: [...legacyElementRoutines.aire.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.aire.chakra.name),
      mantra: normalizeText(legacyElementRoutines.aire.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.aire.intention),
    signsAndHouses: legacyElementRoutines.aire.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.aire.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit);

      return {
        slug,
        element: "aire",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.aire.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.aire.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.aire.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.aire.totalDuration),
  },
};
