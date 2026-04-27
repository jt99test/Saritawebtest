import { asanaImages } from "./asana-image-mapping";
import { elementRoutines as legacyElementRoutines } from "./element-routines";

export type Asana = {
  slug: string;
  nameSanskrit: string;
  nameSpanish: string;
  description: string;
  duration: string;
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
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
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
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
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
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
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
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
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
