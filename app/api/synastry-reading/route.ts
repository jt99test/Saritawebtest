import Anthropic from "@anthropic-ai/sdk";
import type { Message, Tool } from "@anthropic-ai/sdk/resources/messages";

import { isAdminEmail } from "@/lib/admin";
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
import { getPointInterpretiveHouse } from "@/lib/chart";
import { getAspectLabel, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { nativeToneInstruction, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, genderPromptInstructionForSubject, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import type { SynastryAspect } from "@/lib/synastry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type SynastryPayload = {
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
    required: ["compatibilityLabel", "compatibilityDescription", "layers"],
    properties: {
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
  const compatibilityLabel = payload.compatibilityLabel ?? payload.compatibility_label ?? payload.etichettaCompatibilita;
  const compatibilityDescription =
    payload.compatibilityDescription ?? payload.compatibility_description ?? payload.descrizioneCompatibilita;

  if (
    typeof compatibilityLabel === "string" &&
    typeof compatibilityDescription === "string" &&
    layers
  ) {
    return { compatibilityLabel, compatibilityDescription, layers };
  }

  return null;
}

function isSynastryPayload(value: unknown): value is SynastryPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SynastryPayload>;
  const layers = payload.layers as Partial<SynastryPayload["layers"]> | undefined;

  return (
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
    sun ? `${pl("sun", locale)} ${sl(sun.sign, locale)} house ${getPointInterpretiveHouse(sun, chart.houses)}` : null,
    moon ? `${pl("moon", locale)} ${sl(moon.sign, locale)} house ${getPointInterpretiveHouse(moon, chart.houses)}` : null,
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

function buildPrompt({
  name,
  partnerName,
  context,
  locale,
  readingGender,
  partnerReadingGender,
}: {
  name: string;
  partnerName: string;
  context: string;
  locale?: string;
  readingGender?: ReadingGender;
  partnerReadingGender?: ReadingGender;
}) {
  if (locale === "en") {
    return `You are Sarita, an astrologer speaking to ${name} about their relationship with ${partnerName}. Direct, concrete, honest, and practical.

${context}

${genderPromptInstruction(readingGender, locale)}
${genderPromptInstructionForSubject(partnerName, partnerReadingGender, locale)}
${grammarPromptInstruction(locale)}
${nativeToneInstruction(locale)}

Use the synastry_reading tool to return the structured reading.
Tool keys must remain exactly as defined, even when the content is in another language.

Important: compatibilityDescription and each layers.* field must be developed: 3-5 concrete sentences, about 60-95 words each, so they fill roughly 3-5 lines in the card.

Exact shape:
{"reading":"[ONE paragraph of 80-100 words about ${name}'s relationship with ${partnerName}. Use the 2 strongest aspects to describe what is felt, where there is tension, and where there is ease. Give a real coexisting example. End with something concrete ${name} can do.]","compatibilityLabel":"[Short relationship label, max 6 words]","compatibilityDescription":"[3-5 honest and practical sentences about the type of bond. Describe how it feels, where it gets stuck, and what helps care for it.]","layers":{"fisico":"[3-5 practical sentences about physical/body connection based on real aspects]","sexual":"[3-5 practical sentences about attraction, desire, or intensity based on real aspects]","emocional":"[3-5 practical sentences about attachment, safety, and vulnerability based on real aspects]","mental":"[3-5 practical sentences about communication and ideas based on real aspects]","profesional":"[3-5 practical sentences about working or building something together based on real aspects]","evolutivo":"[3-5 practical sentences about what pattern or change this relationship activates based on real aspects]"}}

Rules:
- Every value uses real aspects. Nothing generic.
- Always speak directly to ${name}.
- The first character of every text field is uppercase.
- "reading" is one paragraph, no lists and no headings.
- No mysticism or New Age language.
- Do not add new fields.

${langInstruction(locale)}`;
  }

  if (locale === "it") {
    return `Sei Sarita, un'astrologa che parla con ${name} della sua relazione con ${partnerName}. Diretta, concreta, onesta e pratica.

${context}

${genderPromptInstruction(readingGender, locale)}
${genderPromptInstructionForSubject(partnerName, partnerReadingGender, locale)}
${grammarPromptInstruction(locale)}
${nativeToneInstruction(locale)}

Usa lo strumento synastry_reading per restituire la lettura strutturata.
Le chiavi dello strumento devono restare esattamente come sono definite, anche se il contenuto e in un'altra lingua.

Importante: compatibilityDescription e ogni campo layers.* devono essere sviluppati: 3-5 frasi concrete, circa 60-95 parole ciascuno, cosi occupano circa 3-5 righe nella scheda.

Forma esatta:
{"reading":"[UN paragrafo di 80-100 parole sulla relazione di ${name} con ${partnerName}. Usa i 2 aspetti piu forti per descrivere che cosa si sente, dove c'e tensione e dove c'e facilita. Dai un esempio reale di convivenza. Chiudi con qualcosa di concreto che ${name} puo fare.]","compatibilityLabel":"[Etichetta breve del legame, max 6 parole]","compatibilityDescription":"[3-5 frasi oneste e pratiche sul tipo di legame. Descrivi come si sente, dove si blocca e che cosa aiuta a prendersene cura.]","layers":{"fisico":"[3-5 frasi pratiche sulla connessione fisica/corporea secondo aspetti reali]","sexual":"[3-5 frasi pratiche su attrazione, desiderio o intensita secondo aspetti reali]","emocional":"[3-5 frasi pratiche su attaccamento, sicurezza e vulnerabilita secondo aspetti reali]","mental":"[3-5 frasi pratiche su comunicazione e idee secondo aspetti reali]","profesional":"[3-5 frasi pratiche sul lavorare o costruire qualcosa insieme secondo aspetti reali]","evolutivo":"[3-5 frasi pratiche su quale schema o cambiamento attiva questa relazione secondo aspetti reali]"}}

Regole:
- Ogni valore usa aspetti reali. Nulla di generico.
- Parla sempre direttamente a ${name}.
- Il primo carattere di ogni campo di testo e maiuscolo.
- "reading" e un solo paragrafo, senza liste ne titoli.
- Niente misticismi ne linguaggio New Age.
- Non aggiungere campi nuovi.

${langInstruction(locale)}`;
  }

  return `Eres Sarita, una astrÃ³loga que habla con ${name} sobre su relaciÃ³n con ${partnerName}. Directa, concreta, honesta y prÃ¡ctica.

${context}

${genderPromptInstruction(readingGender, locale)}
${genderPromptInstructionForSubject(partnerName, partnerReadingGender, locale)}
${grammarPromptInstruction(locale)}

Usa la herramienta synastry_reading para devolver la lectura estructurada.
Las claves de la herramienta deben quedar exactamente como estan definidas aunque el contenido este en otro idioma.

Importante: compatibilityDescription y cada layers.* deben ser mas desarrollados: 3-5 frases concretas, unas 60-95 palabras cada uno, para que ocupen aproximadamente 3-5 lineas en la tarjeta.

Forma exacta:
{"reading":"[UN parrafo de 80-100 palabras sobre la relacion de ${name} con ${partnerName}. Usa los 2 aspectos mas fuertes para describir que se siente, donde hay tension, donde hay facilidad. Da un ejemplo real de convivencia. Termina con algo concreto que ${name} puede hacer.]","compatibilityLabel":"[Etiqueta corta del vinculo, max 6 palabras]","compatibilityDescription":"[3-5 frases honestas y practicas sobre el tipo de vinculo. Describe como se siente, donde se traba y que ayuda a cuidarlo.]","layers":{"fisico":"[3-5 frases practicas sobre conexion fisica/corporal segun aspectos reales]","sexual":"[3-5 frases practicas sobre atraccion, deseo o intensidad segun aspectos reales]","emocional":"[3-5 frases practicas sobre apego, seguridad y vulnerabilidad segun aspectos reales]","mental":"[3-5 frases practicas sobre comunicacion e ideas segun aspectos reales]","profesional":"[3-5 frases practicas sobre trabajar o construir algo juntos segun aspectos reales]","evolutivo":"[3-5 frases practicas sobre que patron o cambio activa esta relacion segun aspectos reales]"}}

Reglas:
- Cada valor usa aspectos reales. Nada generico.
- Habla siempre a ${name} directamente.
- El primer caracter de cada campo de texto siempre es mayuscula.
- "reading" es un solo parrafo, sin listas ni subtitulos.
- Sin misticismos ni lenguaje New Age.
- No anadas campos nuevos.

${langInstruction(locale)}`;
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
  const itemKey = `v4:${cacheKey ?? `synastry:${partnerName}:${chartB.event.julianDay}`}:${readingGender || "unspecified"}:${partnerReadingGender || "partner-unspecified"}`;
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
  if (cachedStatus === "generating") return aiGenerationStatusResponse(cachedStatus);

  if (cachedContent) {
    return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(cachedContent)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (!isAdminEmail(user.email) && profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

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

  const prompt = buildPrompt({ name, partnerName, context, locale, readingGender, partnerReadingGender });

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
    assertGeneratedLanguage(parsed, locale);
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

  return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(data)}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}


