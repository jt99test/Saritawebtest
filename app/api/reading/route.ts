import Anthropic from "@anthropic-ai/sdk";

import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { zodiacSigns } from "@/lib/chart";
import { ANTHROPIC_STANDARD_READING_MODEL } from "@/lib/anthropic-models";
import {
  getCachedAiReading,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import { ASPECT_LABELS, HOUSE_AREAS, POINT_LABELS, SIGN_LABELS } from "@/lib/chart-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

function buildPrompt(chart: NatalChartData, pointId: ChartPointId, locale?: string): string {
  const point = chart.points.find((entry) => entry.id === pointId);

  if (!point) {
    return "";
  }

  const sign = zodiacSigns.find((entry) => entry.id === point.sign);
  const signName = SIGN_LABELS[point.sign];
  const element = sign?.element ?? "";
  const modality = sign?.modality ?? "";

  const allPoints = chart.points
    .map((entry) => {
      const signLabel = SIGN_LABELS[entry.sign];
      return `• ${POINT_LABELS[entry.id]} en ${signLabel} ${entry.degreeInSign}°, casa ${entry.house}${entry.retrograde ? " (Rx)" : ""}`;
    })
    .join("\n");

  const pointAspects = chart.aspects
    .filter((aspect) => aspect.from === pointId || aspect.to === pointId)
    .map((aspect) => {
      const otherId = aspect.from === pointId ? aspect.to : aspect.from;
      const other = chart.points.find((entry) => entry.id === otherId);
      const otherSign = other ? SIGN_LABELS[other.sign] : "";
      const aspectName = ASPECT_LABELS[aspect.type];

      return `  - ${aspectName} con ${POINT_LABELS[otherId]} en ${otherSign} (orbe ${aspect.orb}°)`;
    })
    .join("\n");

  return `Eres SARITA, astróloga amiga de ${chart.event.name}. Escribes
de forma directa, sin rodeos y sin poesía. Tu objetivo es que
${chart.event.name} lea esto y piense "claro, eso soy yo."

Estás leyendo el ${POINT_LABELS[pointId]} de ${chart.event.name}:
${signName} ${point.degreeInSign}°, Casa ${point.house} (${HOUSE_AREAS[point.house]}).
${point.retrograde ? "Está retrógrado." : ""}

Aspectos activos:
${pointAspects || "Sin aspectos principales"}

Carta natal completa:
${allPoints}

Escribe UN párrafo de 60-80 palabras. Empieza con una observación directa
sobre cómo se nota este planeta en el día a día de ${chart.event.name}. Da un ejemplo
concreto — una situación en el trabajo, en casa, en sus relaciones o en cómo
reacciona ante algo. Termina con algo que le ayude a entender qué hacer con
esto. Sin subtítulos. Sin párrafos múltiples. Sin metáforas poéticas.

Datos técnicos internos si ayudan: ${element} / ${modality}.

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

    const { chart, pointId, locale, readingId } = (await request.json()) as {
      chart: NatalChartData;
      pointId: ChartPointId;
      locale?: string;
      readingId?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const access = await validateReadingGenerationAccess({ supabase, user, readingId });
    if (!access.ok) {
      return access.response;
    }

    const cachedContent = await getCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "planet",
      itemKey: pointId,
      locale,
    });

    if (typeof cachedContent === "string" && cachedContent.trim()) {
      return new Response(cachedContent, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const prompt = buildPrompt(chart, pointId, locale);

    if (!prompt) {
      return new Response("Unknown point", { status: 400 });
    }

    const stream = client.messages.stream({
      model: ANTHROPIC_STANDARD_READING_MODEL,
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        let content = "";
        const closeSafely = () => {
          if (closed) {
            return;
          }

          closed = true;
          controller.close();
        };

        stream.on("text", (text) => {
          if (!closed) {
            content += text;
            controller.enqueue(encoder.encode(text));
          }
        });
        stream.finalMessage()
          .then(async () => {
            const finalContent = content.trim();
            if (finalContent) {
              await setCachedAiReading({
                supabase,
                user,
                readingId,
                scope: "planet",
                itemKey: pointId,
                locale,
                content: finalContent,
              });
            }
            closeSafely();
          })
          .catch(closeSafely);
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
