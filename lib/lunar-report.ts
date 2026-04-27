export type LunationType = "nueva" | "llena";

export type LunarReportActionSet = {
  hazEsto: string;
  evitaEsto: string;
  preguntate: string;
};

export type LunarReportMetadata = {
  lunationType: LunationType;
  year: number;
  month: number;
  timestamp: string;
  position: {
    sign: string;
    degree: number;
    minutes: number;
    longitude: number;
  };
  activatedHouse: number;
  areaOfLife: string;
  subtitle: string;
  baseMessage: string;
  element: "fire" | "earth" | "air" | "water";
  assignedRoutine: "fuego" | "tierra" | "agua" | "aire";
  routine: {
    element: "fuego" | "tierra" | "agua" | "aire";
    bodyZone: string;
    chakra: { name: string; mantra: string };
    intention: string;
    totalDuration: string;
  };
  activeTransits: Array<{
    transitingPlanet: string;
    natalPlanet: string;
    aspectType: string;
    orb: number;
    exactnessDate: string;
    strength: "tight" | "moderate" | "wide";
    transitingPlanetLabel: string;
    natalPlanetLabel: string;
    aspectLabel: string;
    description: string;
    relevance: string;
  }>;
};

export type LunarReportCacheEntry = {
  metadata: LunarReportMetadata;
  prose: string;
  actions: LunarReportActionSet | null;
};

export type LunarReportStreamEvent =
  | { type: "metadata"; data: LunarReportMetadata }
  | { type: "text"; data: string }
  | { type: "actions"; data: LunarReportActionSet }
  | { type: "done" };
