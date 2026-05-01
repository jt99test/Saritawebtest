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
