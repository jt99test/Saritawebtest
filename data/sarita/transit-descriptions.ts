export type TransitDescription = {
  planet: string;
  relevance: string;
  significantAngles: string[];
  description: string;
};

export const transitDescriptions: Record<string, TransitDescription> = {
  Saturno: {
    planet: "Saturno",
    relevance: "Estructura, responsabilidad, límites, karma",
    significantAngles: ["conjunction", "opposition", "square", "trine"],
    description: "Estructura, responsabilidad, límites, karma",
  },
  Júpiter: {
    planet: "Júpiter",
    relevance: "Expansión, oportunidades, abundancia",
    significantAngles: ["conjunction", "trine", "sextile"],
    description: "Expansión, oportunidades, abundancia",
  },
  Urano: {
    planet: "Urano",
    relevance: "Cambios inesperados, liberación, ruptura",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Cambios inesperados, liberación, ruptura",
  },
  Neptuno: {
    planet: "Neptuno",
    relevance: "Disolución, espiritualidad, confusión o inspiración",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Disolución, espiritualidad, confusión o inspiración",
  },
  Plutón: {
    planet: "Plutón",
    relevance: "Transformación profunda, poder, regeneración",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Transformación profunda, poder, regeneración",
  },
  Marte: {
    planet: "Marte",
    relevance: "Energía, conflicto, acción, impulso",
    significantAngles: ["conjunction", "opposition"],
    description: "Energía, conflicto, acción, impulso",
  },
  Venus: {
    planet: "Venus",
    relevance: "Amor, dinero, valores, relaciones",
    significantAngles: ["conjunction", "opposition"],
    description: "Amor, dinero, valores, relaciones",
  },
};
