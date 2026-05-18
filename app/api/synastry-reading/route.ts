import Anthropic from "@anthropic-ai/sdk";
import type { Message, Tool } from "@anthropic-ai/sdk/resources/messages";

import { ANTHROPIC_PREMIUM_READING_MODEL } from "@/lib/anthropic-models";
import {
  aiGenerationStatusResponse,
  getAiGenerationStatus,
  getCachedAiReading,
  markAiReadingGenerationFailed,
  reserveAiReadingGeneration,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import type { ChartPointId, NatalChartData, SignId } from "@/lib/chart";
import { getAspectLabel, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, genderPromptInstructionForSubject, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import type { SynastryAspect } from "@/lib/synastry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type SynastryPayload = {
  reading: string;
  compatibilityLabel: string;
  compatibilityDescription: string;
  layers: Record<"fisico" | "sexual" | "emocional" | "mental" | "profesional" | "evolutivo", string>;
};

const SYNASTRY_READING_TOOL: Tool = {
  name: "synastry_reading",
  description: "Return the complete practical synastry reading for the SARITA app.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["reading", "compatibilityLabel", "compatibilityDescription", "layers"],
    properties: {
      reading: {
        type: "string",
        description: "One practical paragraph of 80-100 words about the relationship.",
      },
      compatibilityLabel: {
        type: "string",
        description: "Short relationship label, maximum six words.",
      },
      compatibilityDescription: {
        type: "string",
        description: "One or two practical sentences describing the bond.",
      },
      layers: {
        type: "object",
        additionalProperties: false,
        required: ["fisico", "sexual", "emocional", "mental", "profesional", "evolutivo"],
        properties: {
          fisico: { type: "string" },
          sexual: { type: "string" },
          emocional: { type: "string" },
          mental: { type: "string" },
          profesional: { type: "string" },
          evolutivo: { type: "string" },
        },
      },
    },
  },
};

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English. Do not output Spanish words unless they are proper names.";
  if (locale === "it") return "Write entirely in Italian. Do not output Spanish words unless they are proper names.";
  return promptLanguageInstruction(locale);
}

function pl(id: ChartPointId, locale?: string) {
  return getPointLabel(id, locale);
}

function sl(sign: SignId, locale?: string) {
  return getSignLabel(sign, locale);
}

function extractTextContent(message: Message) {
  return message.content
    .map((block) => block.type === "text" ? block.text : "")
    .join("")
    .trim();
}

function extractToolInput(message: Message, toolName: string) {
  const toolBlock = message.content.find((block) => block.type === "tool_use" && block.name === toolName);
  return toolBlock?.type === "tool_use" ? toolBlock.input : null;
}

function cleanJsonPayload(rawPayload: string) {
  const withoutFence = rawPayload
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function parseJsonPayload(rawText: string) {
  return JSON.parse(cleanJsonPayload(rawText)) as unknown;
}

function normalizeLayerAliases(layers: unknown): SynastryPayload["layers"] | null {
  if (!layers || typeof layers !== "object") return null;
  const source = layers as Record<string, unknown>;
  const normalized = {
    fisico: source.fisico ?? source.physical,
    sexual: source.sexual ?? source.sessuale,
    emocional: source.emocional ?? source.emotivo ?? source.emotional,
    mental: source.mental,
    profesional: source.profesional ?? source.professionale ?? source.professional,
    evolutivo: source.evolutivo ?? source.evolutionary,
  };

  if (
    typeof normalized.fisico === "string" &&
    typeof normalized.sexual === "string" &&
    typeof normalized.emocional === "string" &&
    typeof normalized.mental === "string" &&
    typeof normalized.profesional === "string" &&
    typeof normalized.evolutivo === "string"
  ) {
    return normalized as SynastryPayload["layers"];
  }

  return null;
}

function normalizeSynastryPayload(value: unknown): SynastryPayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const layers = normalizeLayerAliases(payload.layers);
  const reading = payload.reading ?? payload.lettura;
  const compatibilityLabel = payload.compatibilityLabel ?? payload.compatibility_label ?? payload.etichettaCompatibilita;
  const compatibilityDescription =
    payload.compatibilityDescription ?? payload.compatibility_description ?? payload.descrizioneCompatibilita;

  if (
    typeof reading === "string" &&
    typeof compatibilityLabel === "string" &&
    typeof compatibilityDescription === "string" &&
    layers
  ) {
    return { reading, compatibilityLabel, compatibilityDescription, layers };
  }

  return null;
}

function isSynastryPayload(value: unknown): value is SynastryPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SynastryPayload>;
  const layers = payload.layers as Partial<SynastryPayload["layers"]> | undefined;

  return (
    typeof payload.reading === "string" &&
    typeof payload.compatibilityLabel === "string" &&
    typeof payload.compatibilityDescription === "string" &&
    typeof layers === "object" &&
    layers !== null &&
    typeof layers.fisico === "string" &&
    typeof layers.sexual === "string" &&
    typeof layers.emocional === "string" &&
    typeof layers.mental === "string" &&
    typeof layers.profesional === "string" &&
    typeof layers.evolutivo === "string"
  );
}

function keyPoints(chart: NatalChartData, locale?: string) {
  const get = (id: ChartPointId) => chart.points.find((point) => point.id === id);
  const sun = get("sun");
  const moon = get("moon");
  const venus = get("venus");
  const mars = get("mars");

  return [
    sun ? `${pl("sun", locale)} ${sl(sun.sign, locale)} house ${sun.house}` : null,
    moon ? `${pl("moon", locale)} ${sl(moon.sign, locale)} house ${moon.house}` : null,
    venus ? `${pl("venus", locale)} ${sl(venus.sign, locale)}` : null,
    mars ? `${pl("mars", locale)} ${sl(mars.sign, locale)}` : null,
  ].filter(Boolean).join(" · ");
}

function buildContext(chartA: NatalChartData, chartB: NatalChartData, partnerName: string, aspects: SynastryAspect[], locale?: string) {
  const topAspects = [...aspects]
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 10)
    .map((aspect) => {
      const quality = aspect.quality === "harmonious" ? "harmonious" : aspect.quality === "tense" ? "tense" : "neutral";
      return `- ${pl(aspect.pointA, locale)} (${chartA.event.name}) ${getAspectLabel(aspect.type, locale)} ${pl(aspect.pointB, locale)} (${partnerName}) - orb ${aspect.orb}°, ${quality}`;
    });

  return [
    `${chartA.event.name}: ${keyPoints(chartA, locale)}`,
    `${partnerName}: ${keyPoints(chartB, locale)}`,
    "",
    "Aspectos más fuertes:",
    ...topAspects,
  ].join("\n");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chartA, chartB, partnerName, aspects, locale, readingId, cacheKey, gender, partnerGender } = await request.json() as {
    chartA: NatalChartData;
    chartB: NatalChartData;
    partnerName: string;
    aspects: SynastryAspect[];
    locale?: string;
    readingId?: string;
    cacheKey?: string;
    gender?: ReadingGender;
    partnerGender?: ReadingGender;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const readingGender = normalizeReadingGender(gender);
  const partnerReadingGender = normalizeReadingGender(partnerGender);
  const itemKey = `${cacheKey ?? `synastry:${partnerName}:${chartB.event.julianDay}`}:${readingGender || "unspecified"}:${partnerReadingGender || "partner-unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "synastry",
    itemKey,
    locale,
    cacheUserId: access.cacheUserId,
  });

  const cachedStatus = getAiGenerationStatus(cachedContent);
  if (cachedStatus) return aiGenerationStatusResponse(cachedStatus);

  if (cachedContent) {
    return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(cachedContent)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const reservation = await reserveAiReadingGeneration({
    supabase,
    user,
    readingId,
    scope: "synastry",
    itemKey,
    locale,
    cacheUserId: access.cacheUserId,
  });

  if (!reservation.ok) return reservation.response;

  if (!reservation.reserved) {
    return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(reservation.content)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const name = chartA.event.name;
  const context = buildContext(chartA, chartB, partnerName, aspects, locale);

  const prompt = `Eres Sarita, una astróloga que habla con ${name} sobre su relación con ${partnerName}. Directa, concreta, honesta y práctica.

${context}

${genderPromptInstruction(readingGender, locale)}
${genderPromptInstructionForSubject(partnerName, partnerReadingGender, locale)}
${grammarPromptInstruction(locale)}

Usa la herramienta synastry_reading para devolver la lectura estructurada.
Las claves de la herramienta deben quedar exactamente como estan definidas aunque el contenido este en otro idioma.

Importante: compatibilityDescription y cada layers.* deben ser mas desarrollados: 3-5 frases concretas, unas 60-95 palabras cada uno, para que ocupen aproximadamente 3-5 lineas en la tarjeta.

Forma exacta:
{"reading":"[UN párrafo de 80-100 palabras sobre la relación de ${name} con ${partnerName}. Usa los 2 aspectos más fuertes para describir qué se siente, dónde hay tensión, dónde hay facilidad. Da un ejemplo real de convivencia. Termina con algo concreto que ${name} puede hacer.]","compatibilityLabel":"[Etiqueta corta del vínculo, máx 6 palabras]","compatibilityDescription":"[3-5 frases honestas y prácticas sobre el tipo de vínculo. Describe cómo se siente, dónde se traba y qué ayuda a cuidarlo.]","layers":{"fisico":"[3-5 frases prácticas sobre conexión física/corporal según aspectos reales]","sexual":"[3-5 frases prácticas sobre atracción, deseo o intensidad según aspectos reales]","emocional":"[3-5 frases prácticas sobre apego, seguridad y vulnerabilidad según aspectos reales]","mental":"[3-5 frases prácticas sobre comunicación e ideas según aspectos reales]","profesional":"[3-5 frases prácticas sobre trabajar o construir algo juntos según aspectos reales]","evolutivo":"[3-5 frases prácticas sobre qué patrón o cambio activa esta relación según aspectos reales]"}}

Reglas:
- Cada valor usa aspectos reales. Nada genérico.
- Habla siempre a ${name} directamente.
- El primer carácter de cada campo de texto siempre es mayúscula.
- "reading" es un solo párrafo, sin listas ni subtítulos.
- Sin misticismos ni lenguaje New Age.
- No anadas campos nuevos.

${langInstruction(locale)}`;

  let parsed: SynastryPayload | null = null;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 2400,
      tools: [SYNASTRY_READING_TOOL],
      tool_choice: { type: "tool", name: SYNASTRY_READING_TOOL.name },
      messages: [{ role: "user", content: prompt }],
    });
    const firstInput = extractToolInput(message, SYNASTRY_READING_TOOL.name);
    parsed = normalizeSynastryPayload(firstInput);

    if (!parsed) {
      const firstText = extractTextContent(message) || JSON.stringify(firstInput);
      const repair = await client.messages.create({
        model: ANTHROPIC_PREMIUM_READING_MODEL,
        max_tokens: 1200,
        tools: [SYNASTRY_READING_TOOL],
        tool_choice: { type: "tool", name: SYNASTRY_READING_TOOL.name },
        messages: [{
          role: "user",
          content: locale === "en" ? `Convert this response into a valid synastry_reading tool call. Do not translate the keys.

Response to repair:
${firstText}` : locale === "it" ? `Converti questa risposta in una chiamata valida allo strumento synastry_reading. Non tradurre le chiavi.

Risposta da riparare:
${firstText}` : `Convierte esta respuesta en una llamada valida a la herramienta synastry_reading. No traduzcas las claves.

Respuesta a reparar:
${firstText}`,
        }],
      });
      parsed = normalizeSynastryPayload(extractToolInput(repair, SYNASTRY_READING_TOOL.name));
    }
  } catch (error) {
    console.error("Synastry reading JSON generation failed", error);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "synastry",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });
    return new Response("Synastry reading JSON could not be parsed", { status: 502 });
  }

  if (!parsed || !isSynastryPayload(parsed)) {
    console.error("Synastry reading JSON shape invalid", parsed);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "synastry",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });
    return new Response("Synastry reading JSON shape invalid", { status: 502 });
  }

  const data = {
    compatibilityLabel: parsed.compatibilityLabel,
    compatibilityDescription: parsed.compatibilityDescription,
    layers: parsed.layers,
  };

  await setCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "synastry",
    itemKey,
    locale,
    cacheUserId: access.cacheUserId,
    content: data,
  });

  return new Response(`${parsed.reading}\n\n${SARITA_DATA_MARKER}\n${JSON.stringify(data)}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
