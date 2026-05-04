import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { ANTHROPIC_PREMIUM_READING_MODEL } from "@/lib/anthropic-models";
import {
  getCachedAiReading,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { ASPECT_LABELS, HOUSE_AREAS, POINT_LABELS } from "@/lib/chart-labels";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type TransitInput = {
  transitingPlanet: ChartPointId;
  natalPlanet: ChartPointId;
  aspectType: string;
  orb: number;
  strength: string;
  natalHouse?: number;
  activatedNatalAspects?: Array<{
    pointA: ChartPointId;
    pointB: ChartPointId;
    aspectType: string;
    orb: number;
  }>;
};

type TransitReadingPayload = {
  reading: string;
  dominantTitle: string;
  dominantBody: string;
  planetLanguage: string;
  houses: Array<{ house: number; title: string; body: string }>;
};

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tu' form.";
}

function extractTextContent(message: Message) {
  return message.content
    .map((block) => block.type === "text" ? block.text : "")
    .join("")
    .trim();
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

function isTransitReadingPayload(value: unknown): value is TransitReadingPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<TransitReadingPayload>;

  return (
    typeof payload.reading === "string" &&
    typeof payload.dominantTitle === "string" &&
    typeof payload.dominantBody === "string" &&
    typeof payload.planetLanguage === "string" &&
    Array.isArray(payload.houses) &&
    payload.houses.every((house) => (
      typeof house === "object" &&
      house !== null &&
      typeof (house as { house?: unknown }).house === "number" &&
      typeof (house as { title?: unknown }).title === "string" &&
      typeof (house as { body?: unknown }).body === "string"
    ))
  );
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chart, transits, locale, readingId, cacheKey, gender } = await request.json() as {
    chart: NatalChartData;
    transits: TransitInput[];
    locale?: string;
    readingId?: string;
    cacheKey?: string;
    gender?: ReadingGender;
  };

  const readingGender = normalizeReadingGender(gender);
  const itemKey = `${cacheKey ?? `transit:${transits.map((transit) => `${transit.transitingPlanet}-${transit.aspectType}-${transit.natalPlanet}`).join("|")}`}:${readingGender || "unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "transit",
    itemKey,
    locale,
  });

  if (cachedContent) {
    return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(cachedContent)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const name = chart.event.name;
  const natalSun = chart.points.find((point) => point.id === "sun");
  const natalMoon = chart.points.find((point) => point.id === "moon");

  const transitLines = transits.slice(0, 6).map((transit) => {
    const houseDesc = transit.natalHouse
      ? ` - ${HOUSE_AREAS[transit.natalHouse] ?? `casa ${transit.natalHouse}`}`
      : "";
    const tightness = transit.strength === "tight"
      ? "muy exacto"
      : transit.strength === "moderate"
        ? "activo"
        : "de fondo";

    const natalPatterns = (transit.activatedNatalAspects ?? [])
      .slice(0, 3)
      .map((aspect) => `${POINT_LABELS[aspect.pointA] ?? aspect.pointA} ${ASPECT_LABELS[aspect.aspectType] ?? aspect.aspectType} ${POINT_LABELS[aspect.pointB] ?? aspect.pointB} natal (orbe ${aspect.orb} grados)`)
      .join("; ");
    const patternDesc = natalPatterns
      ? ` Reactiva memoria natal: ${natalPatterns}.`
      : " No se detecto un aspecto natal directo asociado a este punto.";

    return `- ${POINT_LABELS[transit.transitingPlanet] ?? transit.transitingPlanet} en ${ASPECT_LABELS[transit.aspectType] ?? transit.aspectType} con ${POINT_LABELS[transit.natalPlanet] ?? transit.natalPlanet} natal${houseDesc}. Orbe ${transit.orb} grados, ${tightness}.${patternDesc}`;
  }).join("\n");
  const houseNumbers = [...new Set(transits.slice(0, 6)
    .map((transit) => transit.natalHouse)
    .filter((house): house is number => typeof house === "number"))]
    .slice(0, 3);
  const houseHint = houseNumbers.length ? houseNumbers.join(", ") : "1";

  const prompt = `Eres Sarita, una astrologa que habla con ${name} sobre lo que esta pasando en su cielo ahora mismo. Directa, concreta, util.

Carta natal de ${name}:
- Sol natal: ${natalSun ? `${natalSun.sign} casa ${natalSun.house}` : "-"}
- Luna natal: ${natalMoon ? `${natalMoon.sign} casa ${natalMoon.house}` : "-"}

Transitos activos ahora mismo:
${transitLines}

Logica de lectura:
- La carta natal muestra el que: patrones, memoria profunda y aprendizajes de base.
- Los transitos muestran el cuando: el momento en que esos patrones se activan en la experiencia.
- No leas el transito aislado. Si un transito toca un planeta natal que participa en un aspecto natal, interpreta ese aspecto como una memoria interna que se despierta.
- Evita hablar de castigo o destino fijo. Presenta la activacion como oportunidad de conciencia, integracion y respuesta mas libre.
- Si hay "Reactiva memoria natal", usa esa informacion en dominantBody y en reading.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

Devuelve SOLO JSON valido. Sin markdown, sin bloque de codigo, sin texto antes ni despues.

Importante: dominantBody, planetLanguage y cada houses[].body deben ser mas desarrollados: 3-5 frases concretas, unas 55-85 palabras cada uno, para que ocupen aproximadamente 3-5 lineas en la tarjeta.

Forma exacta:
{"reading":"[UN parrafo de 80-110 palabras. Nombra el transito mas fuerte, di en que area de la vida de ${name} se va a notar y da un ejemplo real de como puede aparecer en los proximos dias. Termina con una recomendacion concreta.]","dominantTitle":"[Nombre del planeta transito + verbo, max 10 palabras]","dominantBody":"[3-5 frases sobre este transito concreto. Que activa. Como se nota. Que conviene hacer. Sin misticismos.]","planetLanguage":"[3-4 frases sobre el caracter de este planeta transitante. Que pide. Como trabaja. Como se siente en la practica.]","houses":[{"house":[numero de casa],"title":"[Titulo evocador para esta casa en este momento, max 8 palabras]","body":"[3-5 frases sobre que pide esta area ahora mismo para ${name}. Concreto, cotidiano y basado en los transitos dados.]"}]}

Los valores "house" en el array deben ser los numeros: ${houseHint}.

Reglas:
- Tono SARITA: directo, practico, como una amiga que sabe astrologia. Sin solemnidad.
- El primer caracter de cada campo de texto es siempre mayuscula.
- "reading" debe ser un solo parrafo, sin listas ni subtitulos.
- Sin frases vagas ni misticismos.
- JSON valido: comillas dobles, sin trailing commas.

${langInstruction(locale)}`;

  let parsed: unknown;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 1100,
      messages: [{ role: "user", content: prompt }],
    });
    parsed = JSON.parse(cleanJsonPayload(extractTextContent(message)));
  } catch (error) {
    console.error("Transit reading JSON generation failed", error);
    return new Response("Transit reading JSON could not be parsed", { status: 502 });
  }

  if (!isTransitReadingPayload(parsed)) {
    console.error("Transit reading JSON shape invalid", parsed);
    return new Response("Transit reading JSON shape invalid", { status: 502 });
  }

  await setCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "transit",
    itemKey,
    locale,
    content: parsed,
  });

  const data = {
    dominantTitle: parsed.dominantTitle,
    dominantBody: parsed.dominantBody,
    planetLanguage: parsed.planetLanguage,
    houses: parsed.houses,
  };

  return new Response(`${parsed.reading}\n\n${SARITA_DATA_MARKER}\n${JSON.stringify(data)}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
