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

export function compatibilityLabel(aspects: SynastryAspect[], locale?: string) {
  const weights: Record<string, number> = {};

  for (const aspect of aspects) {
    const weight = aspect.type === "conjunction" || aspect.type === "opposition" ? 2 : 1;
    weights[aspect.pointA] = (weights[aspect.pointA] ?? 0) + weight;
    weights[aspect.pointB] = (weights[aspect.pointB] ?? 0) + weight;
  }

  const score = (ids: ChartPointId[]) => ids.reduce((total, id) => total + (weights[id] ?? 0), 0);
  const copy = locale === "en"
    ? {
        transformation: { label: "Transformational Bond", description: "This bond touches deeper layers. It can bring desire, shadow, and a clear invitation to change." },
        structure: { label: "Structural Bond", description: "This bond asks for maturity, limits, and real support. It can feel serious because it touches actual commitments." },
        harmony: { label: "Harmonious Bond", description: "This bond opens pleasure, tenderness, and growth. There is ease in recognising what is good in each other." },
        mirror: { label: "Mirror Bond", description: "This bond reflects identity and emotion. The other person shows you something essential about yourself." },
        evolution: { label: "Evolutionary Bond", description: "This bond wakes up change, inspiration, and new questions. It is not always stable, but it is revealing." },
        complex: { label: "Complex Bond", description: "This bond mixes several layers without one clear dominant theme. Read it by levels, not by a single label." },
      }
    : locale === "it"
      ? {
          transformation: { label: "Legame di Trasformazione", description: "Questo legame muove strati profondi. Può portare desiderio, ombra e un invito chiaro a trasformarsi." },
          structure: { label: "Legame di Struttura", description: "Questo legame chiede maturità, limiti e sostegno. Può sembrare serio perché tocca impegni reali." },
          harmony: { label: "Legame di Armonia", description: "Questo legame apre piacere, tenerezza e crescita. C'è facilità nel riconoscere il bene dell'altra persona." },
          mirror: { label: "Legame di Specchio", description: "Questo legame riflette identità ed emozione. L'altra persona mostra qualcosa di essenziale di te." },
          evolution: { label: "Legame di Evoluzione", description: "Questo legame risveglia cambiamento, ispirazione e domande nuove. Non è sempre stabile, ma è rivelatore." },
          complex: { label: "Legame Complesso", description: "Il legame mescola vari livelli senza un solo tema dominante. Conviene leggerlo per strati, non con un'unica etichetta." },
        }
      : {
          transformation: { label: "Vínculo de Transformación", description: "Este vínculo mueve capas profundas. Puede traer deseo, sombra y una invitación clara a transformarse." },
          structure: { label: "Vínculo de Estructura", description: "Este vínculo pide madurez, límites y sostén. Puede sentirse serio porque toca compromisos reales." },
          harmony: { label: "Vínculo de Armonía", description: "Este vínculo abre placer, ternura y crecimiento. Hay facilidad para reconocer lo bueno del otro." },
          mirror: { label: "Vínculo de Espejo", description: "Este vínculo refleja identidad y emoción. La otra persona muestra algo esencial de ti." },
          evolution: { label: "Vínculo de Evolución", description: "Este vínculo despierta cambio, inspiración y preguntas nuevas. No siempre es estable, pero sí revelador." },
          complex: { label: "Vínculo Complejo", description: "El vínculo mezcla varias capas sin una sola dominante. Conviene leerlo por niveles, no por una etiqueta única." },
        };
  const entries = [
    { ...copy.transformation, score: score(["pluto", "mars"]) },
    { ...copy.structure, score: score(["saturn"]) },
    { ...copy.harmony, score: score(["venus", "jupiter"]) },
    { ...copy.mirror, score: score(["sun", "moon"]) },
    { ...copy.evolution, score: score(["uranus", "neptune"]) },
  ].sort((left, right) => right.score - left.score);

  return entries[0]?.score ? entries[0] : copy.complex;
}
