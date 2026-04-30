import Anthropic from "@anthropic-ai/sdk";
import { DateTime } from "luxon";

import type { NatalChartData, SignId } from "@/lib/chart";
import type {
  LunarReportActionSet,
  LunationType,
} from "@/lib/lunar-report";
import { getMonthlyLunarData } from "@/lib/lunar.server";
import { getActiveTransits } from "@/lib/transits.server";
import { houseMessages } from "@/data/sarita/house-messages";
import { elementRoutines } from "@/data/sarita/element-routines";
import { transitDescriptions } from "@/data/sarita/transit-descriptions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LunarReportRequest = {
  chart: NatalChartData;
  year: number;
  month: number;
  lunationType: LunationType;
  metadataOnly?: boolean;
  locale?: string;
};

const ACTIONS_MARKER = "__SARITA_ACTIONS__";

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

const SIGN_LABELS: Record<SignId, string> = {
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

const ASPECT_LABELS = {
  conjunction: "Conjunción",
  sextile: "Sextil",
  square: "Cuadratura",
  trine: "Trígono",
  opposition: "Oposición",
  quincunx: "Quincuncio",
} as const;

const POINT_LABELS = {
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
} as const;

function monthLabel(year: number, month: number, locale?: string) {
  return DateTime.utc(year, month, 1).setLocale(locale ?? "es").toFormat("LLLL yyyy");
}

function buildChartSummary(chart: NatalChartData) {
  const pointLines = chart.points.map((point) => {
    const signName = SIGN_LABELS[point.sign];
    return `- ${POINT_LABELS[point.id]} en ${signName} ${point.degreeInSign}°${String(point.minutesInSign).padStart(2, "0")}', casa ${point.house}${point.retrograde ? " (Rx)" : ""}`;
  });

  const aspectLines = chart.aspects.map((aspect) => {
    return `- ${POINT_LABELS[aspect.from]} ${ASPECT_LABELS[aspect.type]} ${POINT_LABELS[aspect.to]} (orbe ${aspect.orb}°, ${aspect.applying ? "aplicativo" : "separativo"})`;
  });

  return [
    `Ascendente: ${chart.meta.ascendant.toFixed(2)}°`,
    ...pointLines,
    "Aspectos principales:",
    ...(aspectLines.length > 0 ? aspectLines : ["- Sin aspectos registrados"]),
  ].join("\n");
}

async function buildTransitList(chart: NatalChartData, lunationTimestamp: string) {
  const transits = (await getActiveTransits(chart, new Date(lunationTimestamp))).slice(0, 5);

  if (transits.length === 0) {
    return {
      lines: "Ninguno especialmente relevante según los filtros del método.",
      structured: [],
    };
  }

  const structured = transits.map((transit) => {
    const description = transitDescriptions[POINT_LABELS[transit.transitingPlanet]];
    return {
      ...transit,
      transitingPlanetLabel: POINT_LABELS[transit.transitingPlanet],
      natalPlanetLabel: POINT_LABELS[transit.natalPlanet],
      aspectLabel: ASPECT_LABELS[transit.aspectType],
      description: description?.description ?? "",
      relevance: description?.relevance ?? "",
    };
  });

  return {
    lines: structured
      .map((transit) => {
        return `- ${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel} (orbe ${transit.orb}°). Relevancia: ${transit.relevance}.`;
      })
      .join("\n"),
    structured,
  };
}

function buildPrompt({
  chart,
  year,
  month,
  lunationType,
  metadata,
  transitLines,
  locale,
}: {
  chart: NatalChartData;
  year: number;
  month: number;
  lunationType: "nueva" | "llena";
  metadata: {
    signLabel: string;
    degree: number;
    minutes: number;
    house: number;
    areaOfLife: string;
    baseMessage: string;
    eclipse?: { isEclipse: boolean; kind: "solar" | "lunar"; nodeOrb: number };
  };
  transitLines: string;
  locale?: string;
}) {
  const name = chart.event.name;
  const lunaLabel = lunationType === "nueva" ? "Nueva" : "Llena";

  return `Eres una astróloga amiga de ${name} que le está explicando qué le toca este mes según la Luna ${lunaLabel} en su carta.

Tu tono: cercano, directo, útil. Como una amiga que se la sabe, no como una astróloga distante. Ejemplos concretos de cómo esta energía aparece en su día a día. Sin metáforas literarias.

CONTEXTO:
${name} tiene su Luna ${lunaLabel} de ${monthLabel(year, month, locale)} en ${metadata.signLabel} ${metadata.degree}°${String(metadata.minutes).padStart(2, "0")}', activando su Casa ${metadata.house} (${metadata.areaOfLife}).
${metadata.eclipse?.isEclipse ? `Esta lunacion es un eclipse ${metadata.eclipse.kind === "solar" ? "solar" : "lunar"}: ocurre a ${metadata.eclipse.nodeOrb} grados del eje nodal. Tratalo como una activacion mas intensa, con ecos de 6 a 18 meses, no como una luna mensual ordinaria.` : ""}

El mensaje base que da la astróloga Sarita Shakti para esta casa es:
"${metadata.baseMessage}"

Tránsitos activos relevantes este mes:
${transitLines}

Contexto astrológico completo de la persona:
${buildChartSummary(chart)}

TU TAREA:
Escribe una lectura personalizada para ${name} que:
1. Empieza con su nombre y la observación directa: qué Luna es, en qué signo, qué casa activa.
2. Expande el mensaje base de Sarita con ejemplos concretos de cómo se manifiesta en la vida cotidiana de alguien con esta carta natal específica.
3. Si hay tránsitos activos relevantes, los menciona como "contexto adicional este mes".
4. Cierra con consejos prácticos y accionables: qué hacer este mes, qué evitar, qué preguntarse.
4.5. Para cada tránsito activo que menciones, describe UNA situación concreta en la que se podría notar en la vida de ${name}: una conversación, una decisión, una sensación en el cuerpo, una situación en el trabajo o en casa.
5. Tono Spain Spanish, "tú", conversacional. 400-600 palabras. 3-4 párrafos.
6. Incluye literalmente esta frase de Sarita una sola vez dentro del texto, sin cambiarle palabras: "${metadata.baseMessage}"
7. No uses títulos, subtítulos, markdown, listas, emojis ni símbolos decorativos. Solo prosa corrida en párrafos.
8. El primer carácter del texto es siempre mayúscula.

No reescribas el mensaje de Sarita: úsalo como base y exprésalo en el tono amigo. La autoridad astrológica es de Sarita; tú la traduces a una conversación cercana.

${langInstruction(locale)}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if ((profile?.plan ?? "free") === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const { chart, year, month, lunationType, metadataOnly = false, locale } =
      (await request.json()) as LunarReportRequest;

    const monthlyData = await getMonthlyLunarData(chart, year, month);
    const lunation =
      lunationType === "nueva" ? monthlyData.lunaNueva : monthlyData.lunaLlena;

    if (!lunation) {
      return new Response("No lunation found for the requested month", { status: 404 });
    }

    const houseMessage = houseMessages[lunation.activatedHouse - 1];
    if (!houseMessage) {
      return new Response("House message not found", { status: 500 });
    }

    const routine = elementRoutines[lunation.assignedRoutine];
    const transitData = await buildTransitList(chart, lunation.timestamp);
    const baseMessage =
      lunationType === "nueva"
        ? houseMessage.lunaNueva.baseMessage
        : houseMessage.lunaLlena.baseMessage;

    const metadata = {
      lunationType,
      year,
      month,
      timestamp: lunation.timestamp,
      position: lunation.position,
      activatedHouse: lunation.activatedHouse,
      areaOfLife: houseMessage.areaOfLife,
      subtitle:
        lunationType === "nueva"
          ? houseMessage.lunaNueva.subtitle
          : houseMessage.lunaLlena.subtitle,
      baseMessage,
      element: lunation.element,
      assignedRoutine: lunation.assignedRoutine,
      eclipse: lunation.eclipse,
      routine: {
        element: routine.element,
        bodyZone: routine.bodyZone,
        chakra: routine.chakra,
        intention: routine.intention,
        totalDuration: routine.totalDuration,
      },
      activeTransits: transitData.structured,
    };

    if (metadataOnly) {
      return Response.json(metadata);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = buildPrompt({
      chart,
      year,
      month,
      lunationType,
      metadata: {
        signLabel: SIGN_LABELS[lunation.position.sign],
        degree: lunation.position.degree,
        minutes: lunation.position.minutes,
        house: lunation.activatedHouse,
        areaOfLife: houseMessage.areaOfLife,
        baseMessage,
        eclipse: lunation.eclipse,
      },
      transitLines: transitData.lines,
      locale,
    });

    const streamingPrompt = `${prompt}

Después de la lectura principal, añade en una línea final separada exactamente este marcador seguido de un JSON válido en una sola línea:
${ACTIONS_MARKER}{"hazEsto":"...","evitaEsto":"...","preguntate":"..."}

Reglas para esa línea final:
- No añadas texto antes ni después del JSON.
- Cada clave debe tener 1 o 2 frases concretas y accionables.
- "hazEsto" debe ser una acción específica con verbo y objeto. Nunca "trabaja tu interior"; sí "Escribe una lista de lo que quieres cerrar antes de fin de mes."
- "evitaEsto" debe ser una conducta específica. Nunca "evita el exceso"; sí "No empieces proyectos nuevos si tienes tres a medias."
- "preguntate" debe ser una pregunta que la persona pueda sentarse a responder. Nunca "¿Qué quiere tu alma?"; sí "¿Qué llevas más de seis meses diciendo que vas a hacer y no has hecho?"
- Mantén el español de España y el tono cercano.
- La lectura principal debe ir primero, y la línea ${ACTIONS_MARKER} al final.`;

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: streamingPrompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        let textBuffer = "";
        let actionsBuffer = "";
        let markerDetected = false;

        const emitEvent = (event: unknown) => {
          if (!closed) {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
        };

        const closeSafely = () => {
          if (closed) {
            return;
          }

          closed = true;
          controller.close();
        };

        const flushText = (chunk: string) => {
          if (!chunk) {
            return;
          }

          emitEvent({ type: "text", data: chunk });
        };

        const processChunk = (chunk: string) => {
          if (!chunk) {
            return;
          }

          if (markerDetected) {
            actionsBuffer += chunk;
            return;
          }

          textBuffer += chunk;
          const markerIndex = textBuffer.indexOf(ACTIONS_MARKER);

          if (markerIndex >= 0) {
            flushText(textBuffer.slice(0, markerIndex));
            actionsBuffer += textBuffer.slice(markerIndex + ACTIONS_MARKER.length);
            textBuffer = "";
            markerDetected = true;
            return;
          }

          if (textBuffer.length > ACTIONS_MARKER.length - 1) {
            const safeLength = textBuffer.length - (ACTIONS_MARKER.length - 1);
            flushText(textBuffer.slice(0, safeLength));
            textBuffer = textBuffer.slice(safeLength);
          }
        };

        const finalizeActions = () => {
          if (!markerDetected) {
            flushText(textBuffer);
            textBuffer = "";
            return;
          }

          const raw = actionsBuffer.trim();
          if (!raw) {
            return;
          }

          try {
            const parsed = JSON.parse(raw) as LunarReportActionSet;
            emitEvent({ type: "actions", data: parsed });
          } catch (error) {
            console.error("Could not parse lunar actions:", error);
          }
        };

        emitEvent({ type: "metadata", data: metadata });

        stream.on("text", (text) => {
          processChunk(text);
        });

        stream
          .finalMessage()
          .then(() => {
            finalizeActions();
            emitEvent({ type: "done" });
            closeSafely();
          })
          .catch(() => {
            finalizeActions();
            closeSafely();
          });
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
    console.error("Lunar report API error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
