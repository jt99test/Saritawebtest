import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { ANTHROPIC_PREMIUM_READING_MODEL } from "@/lib/anthropic-models";
import {
  getCachedAiReading,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import type { NatalChartData } from "@/lib/chart";
import type { AstrocartographyNearbyLine } from "@/lib/astrocartography";
import { jsonOnlyInstruction, nativeToneInstruction, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AstrocartographyReadingPayload = {
  summaryTitle: string;
  summaryBody: string;
  pros: string[];
  cautions: string[];
  practicalFocus: string;
};

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAstrocartographyReadingPayload(value: unknown): value is AstrocartographyReadingPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<AstrocartographyReadingPayload>;

  return (
    typeof payload.summaryTitle === "string" &&
    typeof payload.summaryBody === "string" &&
    isStringArray(payload.pros) &&
    isStringArray(payload.cautions) &&
    typeof payload.practicalFocus === "string"
  );
}

function lineContext(lines: AstrocartographyNearbyLine[]) {
  return lines.map((line) => (
    `- ${line.planetLabel} ${line.angle}: ${line.distanceKm} km, influence ${line.influence}`
  )).join("\n");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chart, location, nearbyLines, locale, readingId, cacheKey, gender } = await request.json() as {
    chart: NatalChartData;
    location: { displayName: string; lat: number; lng: number; country?: string };
    nearbyLines: AstrocartographyNearbyLine[];
    locale?: string;
    readingId?: string;
    cacheKey?: string;
    gender?: ReadingGender;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const readingGender = normalizeReadingGender(gender);
  const itemKey = `${cacheKey ?? `astrocartography:${location.lat.toFixed(3)},${location.lng.toFixed(3)}`}:${readingGender || "unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "astrocartography",
    itemKey,
    locale,
  });

  if (cachedContent) {
    return Response.json(cachedContent, { headers: { "Cache-Control": "no-cache" } });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  const prompt = locale === "it" ? `Sei Sarita, un'astrologa pratica che legge l'astrocartografia di ${chart.event.name}.

Carta natale:
- Nome: ${chart.event.name}
- Luogo di nascita: ${chart.event.locationLabel}
- Sole: ${sun ? `${sun.sign}, casa ${sun.house}` : "-"}
- Luna: ${moon ? `${moon.sign}, casa ${moon.house}` : "-"}

Luogo selezionato:
- ${location.displayName}
- Latitudine ${location.lat}, longitudine ${location.lng}

Linee astrocartografiche piu vicine:
${lineContext(nearbyLines)}

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

${jsonOnlyInstruction(locale)}

Forma esatta:
{"summaryTitle":"[Titolo breve evocativo, max 8 parole]","summaryBody":"[Un paragrafo pratico, 75-105 parole. Spiega il tono emotivo e di vita di abitare/viaggiare qui a partire dalle linee piu vicine. Includi opportunita e attrito.]","pros":["[Beneficio concreto 1]","[Beneficio concreto 2]","[Beneficio concreto 3]"],"cautions":["[Cautela concreta 1]","[Cautela concreta 2]"],"practicalFocus":"[Una raccomandazione radicata su come ${chart.event.name} puo usare bene questo luogo.]"}

Regole:
- Usa le linee piu vicine per distanza; non inventare pianeti non elencati.
- Spiega pro e contro con chiarezza.
- Tono SARITA: diretto, caldo, utile, non fatalista.
- Niente misticismo vago.
- Il primo carattere di ogni campo testuale deve essere maiuscolo.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}` : locale === "es" || !locale ? `Eres Sarita, una astrologa practica leyendo la astrocartografia de ${chart.event.name}.

Carta natal:
- Nombre: ${chart.event.name}
- Lugar de nacimiento: ${chart.event.locationLabel}
- Sol: ${sun ? `${sun.sign}, casa ${sun.house}` : "-"}
- Luna: ${moon ? `${moon.sign}, casa ${moon.house}` : "-"}

Lugar seleccionado:
- ${location.displayName}
- Latitud ${location.lat}, longitud ${location.lng}

Lineas de astrocartografia mas cercanas:
${lineContext(nearbyLines)}

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

${jsonOnlyInstruction(locale)}

Forma exacta:
{"summaryTitle":"[Titulo breve y evocador, max 8 palabras]","summaryBody":"[Un parrafo practico, 75-105 palabras. Explica el tono emocional y vital de vivir/viajar aqui desde las lineas mas cercanas. Incluye oportunidad y friccion.]","pros":["[Beneficio concreto 1]","[Beneficio concreto 2]","[Beneficio concreto 3]"],"cautions":["[Cuidado concreto 1]","[Cuidado concreto 2]"],"practicalFocus":"[Una recomendacion aterrizada para que ${chart.event.name} use bien este lugar.]"}

Reglas:
- Usa las lineas mas cercanas por distancia; no inventes planetas no listados.
- Explica pros y contras con claridad.
- Tono SARITA: directo, calido, util, no fatalista.
- Nada de misticismo vago.
- El primer caracter de cada campo de texto debe ser mayuscula.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}` : `You are Sarita, a practical astrologer reading astrocartography for ${chart.event.name}.

Birth chart:
- Name: ${chart.event.name}
- Birth place: ${chart.event.locationLabel}
- Sun: ${sun ? `${sun.sign}, house ${sun.house}` : "-"}
- Moon: ${moon ? `${moon.sign}, house ${moon.house}` : "-"}

Selected location:
- ${location.displayName}
- Latitude ${location.lat}, longitude ${location.lng}

Closest astrocartography lines:
${lineContext(nearbyLines)}

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

${jsonOnlyInstruction(locale)}

Exact shape:
{"summaryTitle":"[Short evocative title, max 8 words]","summaryBody":"[One practical paragraph, 75-105 words. Explain the emotional and life tone of living/travelling here from the closest lines. Include both opportunity and friction.]","pros":["[Concrete benefit 1]","[Concrete benefit 2]","[Concrete benefit 3]"],"cautions":["[Concrete caution 1]","[Concrete caution 2]"],"practicalFocus":"[One grounded recommendation for how ${chart.event.name} can use this place well.]"}

Rules:
- Use the closest lines by distance; do not invent planets not listed.
- Explain pros and cons clearly.
- Keep SARITA tone: direct, warm, useful, not fatalistic.
- No vague mysticism.
- First character of every text field must be uppercase.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}`;

  let parsed: unknown;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    parsed = JSON.parse(cleanJsonPayload(extractTextContent(message)));
  } catch (error) {
    console.error("Astrocartography reading JSON generation failed", error);
    return new Response("Astrocartography reading JSON could not be parsed", { status: 502 });
  }

  if (!isAstrocartographyReadingPayload(parsed)) {
    console.error("Astrocartography reading JSON shape invalid", parsed);
    return new Response("Astrocartography reading JSON shape invalid", { status: 502 });
  }

  await setCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "astrocartography",
    itemKey,
    locale,
    content: parsed,
  });

  return Response.json(parsed, {
    headers: {
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
