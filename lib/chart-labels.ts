import type { ChartPointId, SignId } from "@/lib/chart";

export const SIGN_LABELS: Record<SignId, string> = {
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
};

export const POINT_LABELS: Record<ChartPointId, string> = {
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

export const ASPECT_LABELS: Record<string, string> = {
  conjunction: "Conjunción",
  sextile: "Sextil",
  square: "Cuadratura",
  trine: "Trígono",
  opposition: "Oposición",
  quincunx: "Quincuncio",
};

export const HOUSE_AREAS: Record<number, string> = {
  1: "identidad y cuerpo",
  2: "dinero y recursos",
  3: "comunicación y mente",
  4: "hogar y familia",
  5: "creatividad y placer",
  6: "trabajo y salud",
  7: "pareja y vínculos",
  8: "transformación e intimidad",
  9: "viajes y sentido",
  10: "carrera y vocación",
  11: "amigos y proyectos",
  12: "descanso e inconsciente",
};

const LOCALIZED_SIGN_LABELS: Record<string, Record<SignId, string>> = {
  es: SIGN_LABELS,
  en: {
    aries: "Aries",
    taurus: "Taurus",
    gemini: "Gemini",
    cancer: "Cancer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Scorpio",
    sagittarius: "Sagittarius",
    capricorn: "Capricorn",
    aquarius: "Aquarius",
    pisces: "Pisces",
  },
  it: {
    aries: "Ariete",
    taurus: "Toro",
    gemini: "Gemelli",
    cancer: "Cancro",
    leo: "Leone",
    virgo: "Vergine",
    libra: "Bilancia",
    scorpio: "Scorpione",
    sagittarius: "Sagittario",
    capricorn: "Capricorno",
    aquarius: "Acquario",
    pisces: "Pesci",
  },
};

const LOCALIZED_POINT_LABELS: Record<string, Record<ChartPointId, string>> = {
  es: POINT_LABELS,
  en: {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    northNode: "North Node",
    southNode: "South Node",
    chiron: "Chiron",
    partOfFortune: "Part of Fortune",
    lilith: "Lilith",
    ceres: "Ceres",
  },
  it: {
    sun: "Sole",
    moon: "Luna",
    mercury: "Mercurio",
    venus: "Venere",
    mars: "Marte",
    jupiter: "Giove",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Nettuno",
    pluto: "Plutone",
    northNode: "Nodo Nord",
    southNode: "Nodo Sud",
    chiron: "Chirone",
    partOfFortune: "Parte di Fortuna",
    lilith: "Lilith",
    ceres: "Cerere",
  },
};

const LOCALIZED_ASPECT_LABELS: Record<string, Record<string, string>> = {
  es: ASPECT_LABELS,
  en: {
    conjunction: "Conjunction",
    sextile: "Sextile",
    square: "Square",
    trine: "Trine",
    opposition: "Opposition",
    quincunx: "Quincunx",
  },
  it: {
    conjunction: "Congiunzione",
    sextile: "Sestile",
    square: "Quadratura",
    trine: "Trigono",
    opposition: "Opposizione",
    quincunx: "Quinconce",
  },
};

const LOCALIZED_HOUSE_AREAS: Record<string, Record<number, string>> = {
  es: HOUSE_AREAS,
  en: {
    1: "identity and body",
    2: "money and resources",
    3: "communication and mind",
    4: "home and family",
    5: "creativity and pleasure",
    6: "work and health",
    7: "partners and bonds",
    8: "transformation and intimacy",
    9: "travel and meaning",
    10: "career and vocation",
    11: "friends and projects",
    12: "rest and the unconscious",
  },
  it: {
    1: "identita e corpo",
    2: "denaro e risorse",
    3: "comunicazione e mente",
    4: "casa e famiglia",
    5: "creativita e piacere",
    6: "lavoro e salute",
    7: "partner e legami",
    8: "trasformazione e intimita",
    9: "viaggi e senso",
    10: "carriera e vocazione",
    11: "amicizie e progetti",
    12: "riposo e inconscio",
  },
};

function localeKey(locale?: string) {
  return locale === "en" || locale === "it" ? locale : "es";
}

export function getSignLabel(sign: SignId, locale?: string) {
  return LOCALIZED_SIGN_LABELS[localeKey(locale)][sign] ?? SIGN_LABELS[sign] ?? sign;
}

export function getPointLabel(point: ChartPointId, locale?: string) {
  return LOCALIZED_POINT_LABELS[localeKey(locale)][point] ?? POINT_LABELS[point] ?? point;
}

export function getAspectLabel(aspect: string, locale?: string) {
  return LOCALIZED_ASPECT_LABELS[localeKey(locale)][aspect] ?? ASPECT_LABELS[aspect] ?? aspect;
}

export function getHouseArea(house: number, locale?: string) {
  return LOCALIZED_HOUSE_AREAS[localeKey(locale)][house] ?? HOUSE_AREAS[house] ?? "";
}
