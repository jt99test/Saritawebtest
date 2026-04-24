import Anthropic from "@anthropic-ai/sdk";

import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { zodiacSigns } from "@/lib/chart";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(chart: NatalChartData, pointId: ChartPointId): string {
  const point = chart.points.find((entry) => entry.id === pointId);

  if (!point) {
    return "";
  }

  const sign = zodiacSigns.find((entry) => entry.id === point.sign);
  const signName = point.sign.charAt(0).toUpperCase() + point.sign.slice(1);
  const element = sign?.element ?? "";
  const modality = sign?.modality ?? "";

  const allPoints = chart.points
    .map((entry) => {
      const signLabel = entry.sign.charAt(0).toUpperCase() + entry.sign.slice(1);
      return `• ${entry.id.charAt(0).toUpperCase() + entry.id.slice(1)} en ${signLabel} ${entry.degreeInSign}°, casa ${entry.house}${entry.retrograde ? " (Rx)" : ""}`;
    })
    .join("\n");

  const pointAspects = chart.aspects
    .filter((aspect) => aspect.from === pointId || aspect.to === pointId)
    .map((aspect) => {
      const otherId = aspect.from === pointId ? aspect.to : aspect.from;
      const other = chart.points.find((entry) => entry.id === otherId);
      const otherSign = other ? other.sign.charAt(0).toUpperCase() + other.sign.slice(1) : "";
      const aspectName = {
        conjunction: "Conjunción",
        sextile: "Sextil",
        square: "Cuadratura",
        trine: "Trígono",
        opposition: "Oposición",
        quincunx: "Quincuncio",
      }[aspect.type];

      return `  - ${aspectName} con ${otherId} en ${otherSign} (orbe ${aspect.orb}°)`;
    })
    .join("\n");

  const ascSign = zodiacSigns.find(
    (entry) => entry.start <= chart.meta.ascendant && chart.meta.ascendant < entry.start + 30,
  )?.id ?? "unknown";
  const risingName = ascSign.charAt(0).toUpperCase() + ascSign.slice(1);

  const pointName: Record<ChartPointId, string> = {
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
  };

  const houseNames: Record<number, string> = {
    1: "Casa 1 (Identidad)",
    2: "Casa 2 (Recursos)",
    3: "Casa 3 (Comunicación)",
    4: "Casa 4 (Hogar)",
    5: "Casa 5 (Creatividad)",
    6: "Casa 6 (Servicio)",
    7: "Casa 7 (Relaciones)",
    8: "Casa 8 (Transformación)",
    9: "Casa 9 (Filosofía)",
    10: "Casa 10 (Carrera)",
    11: "Casa 11 (Ideales)",
    12: "Casa 12 (Inconsciente)",
  };

  return `Eres SARITA, una astróloga excepcional con décadas de experiencia. Escribes interpretaciones íntimas, poéticas y psicológicamente precisas. Tu estilo es elegante: cercano pero no superficial, revelador pero no abrumador.

Estás leyendo la carta natal de ${chart.event.name}, nacido/a el ${chart.event.dateLabel} en ${chart.event.locationLabel}.

CARTA NATAL COMPLETA:
Ascendente: ${risingName}
${allPoints}

ASPECTO A INTERPRETAR:
${pointName[pointId]} en ${signName} ${point.degreeInSign}° ${point.minutesInSign}′, ${houseNames[point.house] ?? `Casa ${point.house}`}${point.retrograde ? " — Retrógrado" : ""}
Signo: ${element.charAt(0).toUpperCase() + element.slice(1)} / ${modality.charAt(0).toUpperCase() + modality.slice(1)}

ASPECTOS ACTIVOS:
${pointAspects || "  - Sin aspectos principales"}

Escribe una interpretación personal, íntima y profunda para ${chart.event.name}.
- Escribe en segunda persona ("tu ${pointName[pointId].toLowerCase()}...").
- Menciona el contexto de los aspectos cuando enriquezca la lectura.
- No uses jerga técnica en exceso; prefiere el lenguaje psicológico y poético.
- 4 párrafos, fluidos y sin subtítulos.
- Escribe en español de España.`;
}

export async function POST(request: Request) {
  try {
    const { chart, pointId } = (await request.json()) as {
      chart: NatalChartData;
      pointId: ChartPointId;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const prompt = buildPrompt(chart, pointId);

    if (!prompt) {
      return new Response("Unknown point", { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const closeSafely = () => {
          if (closed) {
            return;
          }

          closed = true;
          controller.close();
        };

        stream.on("text", (text) => {
          if (!closed) {
            controller.enqueue(encoder.encode(text));
          }
        });
        stream.finalMessage().then(closeSafely).catch(closeSafely);
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Reading API error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
