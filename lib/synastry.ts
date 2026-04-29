import type { AspectId, ChartPointId, NatalChartData } from "@/lib/chart";

export type SynastryAspect = {
  pointA: ChartPointId;
  pointB: ChartPointId;
  type: AspectId;
  orb: number;
  quality: "harmonious" | "tense" | "neutral";
};

const ASPECTS: Array<{ type: AspectId; angle: number; orb: number }> = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "opposition", angle: 180, orb: 8 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "square", angle: 90, orb: 7 },
  { type: "sextile", angle: 60, orb: 5 },
  { type: "quincunx", angle: 150, orb: 3 },
];

const INTER_ASPECT_IDS = new Set<ChartPointId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
]);

function circularDistance(first: number, second: number) {
  const difference = Math.abs(first - second);
  return difference > 180 ? 360 - difference : difference;
}

function qualityFor(type: AspectId, pointA: ChartPointId, pointB: ChartPointId): SynastryAspect["quality"] {
  if (type === "trine" || type === "sextile") return "harmonious";
  if (type === "conjunction" && (pointA === "venus" || pointA === "jupiter" || pointB === "venus" || pointB === "jupiter")) {
    return "harmonious";
  }
  if (type === "conjunction") return "neutral";
  return "tense";
}

export function calculateSynastryAspects(chartA: NatalChartData, chartB: NatalChartData): SynastryAspect[] {
  const pointsA = chartA.points.filter((point) => INTER_ASPECT_IDS.has(point.id));
  const pointsB = chartB.points.filter((point) => INTER_ASPECT_IDS.has(point.id));
  const aspects: SynastryAspect[] = [];

  for (const pointA of pointsA) {
    for (const pointB of pointsB) {
      const distance = circularDistance(pointA.longitude, pointB.longitude);
      const match = ASPECTS.find((aspect) => Math.abs(distance - aspect.angle) <= aspect.orb);

      if (match) {
        aspects.push({
          pointA: pointA.id,
          pointB: pointB.id,
          type: match.type,
          orb: Math.round(Math.abs(distance - match.angle) * 10) / 10,
          quality: qualityFor(match.type, pointA.id, pointB.id),
        });
      }
    }
  }

  return aspects.sort((left, right) => left.orb - right.orb);
}

export function compatibilityLabel(aspects: SynastryAspect[]) {
  const weights: Record<string, number> = {};

  for (const aspect of aspects) {
    const weight = aspect.type === "conjunction" || aspect.type === "opposition" ? 2 : 1;
    weights[aspect.pointA] = (weights[aspect.pointA] ?? 0) + weight;
    weights[aspect.pointB] = (weights[aspect.pointB] ?? 0) + weight;
  }

  const score = (ids: ChartPointId[]) => ids.reduce((total, id) => total + (weights[id] ?? 0), 0);
  const entries = [
    { label: "Vínculo de Transformación", score: score(["pluto", "mars"]), description: "Este vínculo mueve capas profundas. Puede traer deseo, sombra y una invitación clara a transformarse." },
    { label: "Vínculo de Estructura", score: score(["saturn"]), description: "Este vínculo pide madurez, límites y sostén. Puede sentirse serio porque toca compromisos reales." },
    { label: "Vínculo de Armonía", score: score(["venus", "jupiter"]), description: "Este vínculo abre placer, ternura y crecimiento. Hay facilidad para reconocer lo bueno del otro." },
    { label: "Vínculo de Espejo", score: score(["sun", "moon"]), description: "Este vínculo refleja identidad y emoción. La otra persona muestra algo esencial de ti." },
    { label: "Vínculo de Evolución", score: score(["uranus", "neptune"]), description: "Este vínculo despierta cambio, inspiración y preguntas nuevas. No siempre es estable, pero sí revelador." },
  ].sort((left, right) => right.score - left.score);

  return entries[0]?.score ? entries[0] : { label: "Vínculo Complejo", description: "El vínculo mezcla varias capas sin una sola dominante. Conviene leerlo por niveles, no por una etiqueta única." };
}
