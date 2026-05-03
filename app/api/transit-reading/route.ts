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
  return "Write in Spanish from Spain. Use the 'tú' form.";
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

    return `- ${POINT_LABELS[transit.transitingPlanet] ?? transit.transitingPlanet} en ${ASPECT_LABELS[transit.aspectType] ?? transit.aspectType} con ${POINT_LABELS[transit.natalPlanet] ?? transit.natalPlanet} natal${houseDesc}. Orbe ${transit.orb}°, ${tightness}.`;
  }).join("\n");
  const houseNumbers = [...new Set(transits.slice(0, 6)
    .map((transit) => transit.natalHouse)
    .filter((house): house is number => typeof house === "number"))]
    .slice(0, 3);
  const houseHint = houseNumbers.length ? houseNumbers.join(", ") : "1";

  const prompt = `Eres Sarita, una astróloga que habla con ${name} sobre lo que está pasando en su cielo ahora mismo. Directa, concreta, útil.

Carta natal de ${name}:
- Sol natal: ${natalSun ? `${natalSun.sign} casa ${natalSun.house}` : "-"}
- Luna natal: ${natalMoon ? `${natalMoon.sign} casa ${natalMoon.house}` : "-"}

Tránsitos activos ahora mismo:
${transitLines}

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

Devuelve SOLO JSON válido. Sin markdown, sin bloque de código, sin texto antes ni después.

Importante: dominantBody, planetLanguage y cada houses[].body deben ser mas desarrollados: 3-5 frases concretas, unas 55-85 palabras cada uno, para que ocupen aproximadamente 3-5 lineas en la tarjeta.

Forma exacta:
{"reading":"[UN párrafo de 80-110 palabras. Nombra el tránsito más fuerte, di en qué área de la vida de ${name} se va a notar y da un ejemplo real de cómo puede aparecer en los próximos días. Termina con una recomendación concreta.]","dominantTitle":"[Nombre del planeta tránsito + verbo, máx 10 palabras]","dominantBody":"[3-5 frases sobre este tránsito concreto. Qué activa. Cómo se nota. Qué conviene hacer. Sin misticismos.]","planetLanguage":"[3-4 frases sobre el carácter de este planeta transitante. Qué pide. Cómo trabaja. Cómo se siente en la práctica.]","houses":[{"house":[número de casa],"title":"[Título evocador para esta casa en este momento, máx 8 palabras]","body":"[3-5 frases sobre qué pide esta área ahora mismo para ${name}. Concreto, cotidiano y basado en los tránsitos dados.]"}]}

Los valores "house" en el array deben ser los números: ${houseHint}.

Reglas:
- Tono SARITA: directo, práctico, como una amiga que sabe astrología. Sin solemnidad.
- El primer carácter de cada campo de texto es siempre mayúscula.
- "reading" debe ser un solo párrafo, sin listas ni subtítulos.
- Sin frases vagas ni misticismos.
- JSON válido: comillas dobles, sin trailing commas.

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
