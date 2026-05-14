import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

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
import { getAspectLabel, getHouseArea, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { calculateSynastryAspects } from "@/lib/synastry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type SolarReturnPayload = {
  reading: string;
  cards: Array<{ key: string; title: string; body: string }>;
  priorities: Array<{ title: string; body: string }>;
};

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English. Do not output Spanish words unless they are proper names.";
  if (locale === "it") return "Write entirely in Italian. Do not output Spanish words unless they are proper names.";
  return promptLanguageInstruction(locale);
}

function signLabel(sign: SignId, locale?: string) {
  return getSignLabel(sign, locale);
}

function ascendantSign(deg: number): SignId {
  const signs: SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  return signs[Math.floor((((deg % 360) + 360) % 360) / 30)] ?? "aries";
}

function getPoint(chart: NatalChartData, id: ChartPointId) {
  return chart.points.find((point) => point.id === id);
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

function isTextCard(value: unknown): value is { key: string; title: string; body: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { key?: unknown }).key === "string" &&
    typeof (value as { title?: unknown }).title === "string" &&
    typeof (value as { body?: unknown }).body === "string"
  );
}

function isPriority(value: unknown): value is { title: string; body: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { title?: unknown }).title === "string" &&
    typeof (value as { body?: unknown }).body === "string"
  );
}

function isSolarReturnPayload(value: unknown): value is SolarReturnPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SolarReturnPayload>;
  return (
    typeof payload.reading === "string" &&
    Array.isArray(payload.cards) &&
    payload.cards.length === 3 &&
    payload.cards.every(isTextCard) &&
    Array.isArray(payload.priorities) &&
    payload.priorities.length === 3 &&
    payload.priorities.every(isPriority)
  );
}

function buildContext(natal: NatalChartData, rs: NatalChartData, locale?: string) {
  const rsAsc = signLabel(ascendantSign(rs.meta.ascendant), locale);
  const rsSun = getPoint(rs, "sun");
  const rsMoon = getPoint(rs, "moon");
  const rsSaturn = getPoint(rs, "saturn");
  const rsJupiter = getPoint(rs, "jupiter");
  const rsMars = getPoint(rs, "mars");
  const rsVenus = getPoint(rs, "venus");
  const natalSun = getPoint(natal, "sun");
  const natalMoon = getPoint(natal, "moon");

  const angulars = rs.points
    .filter((point) => [1, 4, 7, 10].includes(point.house) && ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].includes(point.id))
    .map((point) => `${getSignLabel(point.sign, locale)} in house ${point.house}`);
  const rsAspects = rs.aspects
    .slice()
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 8)
    .map((aspect) => `${getPointLabel(aspect.from, locale)} ${getAspectLabel(aspect.type, locale)} ${getPointLabel(aspect.to, locale)} (orb ${aspect.orb}°)`);
  const natalSolarAspects = calculateSynastryAspects(natal, rs)
    .slice(0, 10)
    .map((aspect) => `${getPointLabel(aspect.pointB, locale)} RS ${getAspectLabel(aspect.type, locale)} ${getPointLabel(aspect.pointA, locale)} natal (orb ${aspect.orb}°)`);

  return [
    `Persona: ${natal.event.name}`,
    "",
    "REVOLUCION SOLAR:",
    `Ascendente RS: ${rsAsc} - tono de entrada al año`,
    rsSun ? `Solar Return Sun: ${signLabel(rsSun.sign, locale)}, house ${rsSun.house} (${getHouseArea(rsSun.house, locale) || "-"}) - main yearly focus` : null,
    rsMoon ? `Solar Return Moon: ${signLabel(rsMoon.sign, locale)}, house ${rsMoon.house} (${getHouseArea(rsMoon.house, locale) || "-"}) - emotional tone of the year` : null,
    rsJupiter ? `Solar Return Jupiter: ${signLabel(rsJupiter.sign, locale)}, house ${rsJupiter.house}` : null,
    rsSaturn ? `Solar Return Saturn: ${signLabel(rsSaturn.sign, locale)}, house ${rsSaturn.house}` : null,
    rsMars ? `Solar Return Mars: ${signLabel(rsMars.sign, locale)}, house ${rsMars.house}` : null,
    rsVenus ? `Solar Return Venus: ${signLabel(rsVenus.sign, locale)}, house ${rsVenus.house}` : null,
    angulars.length ? `Angulares RS: ${angulars.join(", ")}` : null,
    rsAspects.length ? `Aspectos principales RS: ${rsAspects.join("; ")}` : null,
    natalSolarAspects.length ? `Aspectos RS a carta natal: ${natalSolarAspects.join("; ")}` : null,
    "",
    "CARTA NATAL:",
    natalSun ? `Natal Sun: ${signLabel(natalSun.sign, locale)}, house ${natalSun.house}` : null,
    natalMoon ? `Natal Moon: ${signLabel(natalMoon.sign, locale)}, house ${natalMoon.house}` : null,
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { natalChartData, solarReturnData, locale, readingId, cacheKey, gender } = await request.json() as {
    natalChartData: NatalChartData;
    solarReturnData: NatalChartData;
    locale?: string;
    readingId?: string;
    cacheKey?: string;
    gender?: ReadingGender;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const readingGender = normalizeReadingGender(gender);
  const itemKey = `${cacheKey ?? `solar-return:${solarReturnData.meta.solarReturnYear ?? solarReturnData.event.title}`}:${readingGender || "unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "solar_return",
    itemKey,
    locale,
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
    scope: "solar_return",
    itemKey,
    locale,
  });

  if (!reservation.ok) return reservation.response;

  if (!reservation.reserved) {
    return new Response(`${SARITA_DATA_MARKER}${JSON.stringify(reservation.content)}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const name = natalChartData.event.name;
  const context = buildContext(natalChartData, solarReturnData, locale);

  const prompt = `Eres Sarita, una astróloga que habla con ${name} como una amiga muy bien informada. Directa, clara, práctica. Sin frases vagas ni misticismos.

${context}

Logica de lectura de Revolucion Solar:
- La carta natal es el terreno: memoria profunda, patrones de base y significado principal.
- La Revolucion Solar no sustituye ni contradice la carta natal; muestra el escenario anual donde ese terreno se despliega.
- Lee la RS siempre en dialogo con la carta natal: el Sol RS, la Luna RS, el Ascendente RS y los planetas angulares muestran como y donde se activa el aprendizaje natal durante este ano.
- No presentes la lectura como prediccion fatalista. Presentala como proceso, clima evolutivo y guia de conciencia para vivir el ano con mas presencia.
- Si una casa RS esta enfatizada, explica el area anual; si un planeta RS esta angular o destacado, explica que experiencia busca volverse visible.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

Devuelve SOLO JSON válido. Sin markdown, sin bloque de código, sin texto antes ni después.

Importante: los tres campos cards[].body (theme, area y tone) deben ser largos: 4-5 frases concretas, unas 70-95 palabras cada uno, para que ocupen aproximadamente 5-6 lineas en la tarjeta.

Forma exacta:
{"reading":"[UN párrafo de 80-100 palabras sobre el año de ${name}. Usa Ascendente RS y Sol RS para decir el tema central. Da un ejemplo concreto de cómo puede notarlo en su vida. Termina con una o dos cosas prácticas.]","cards":[{"key":"theme","title":"[Título breve del tema del año, máx 6 palabras]","body":"[4-5 frases prácticas sobre el Ascendente RS y el tono general. Qué cambia, cómo se nota, qué observar y una acción concreta.]"},{"key":"area","title":"[Título breve del área principal, máx 6 palabras]","body":"[4-5 frases prácticas sobre el Sol RS: área de foco, cómo se nota, qué pide sostener y un ejemplo cotidiano.]"},{"key":"tone","title":"[Título breve del tono emocional, máx 6 palabras]","body":"[4-5 frases prácticas sobre la Luna RS: necesidades internas, reacción emocional posible, cuidado y recomendación concreta.]"}],"priorities":[{"title":"[Prioridad 1, máx 7 palabras]","body":"[3-4 frases concretas sobre qué hacer este año]"},{"title":"[Prioridad 2, máx 7 palabras]","body":"[3-4 frases concretas]"},{"title":"[Prioridad 3, máx 7 palabras]","body":"[3-4 frases concretas]"}]}

Reglas:
- Las 3 prioridades nacen de Ascendente RS, Sol RS y Luna RS.
- Nada genérico. Cada campo debe usar los datos dados.
- El primer carácter de cada campo de texto siempre es mayúscula.
- "reading" es un solo párrafo, sin listas ni subtítulos.
- JSON válido: comillas dobles, sin trailing commas.

${langInstruction(locale)}`;

  let parsed: unknown;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 1700,
      messages: [{ role: "user", content: prompt }],
    });
    parsed = JSON.parse(cleanJsonPayload(extractTextContent(message)));
  } catch (error) {
    console.error("Solar return reading JSON generation failed", error);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "solar_return",
      itemKey,
      locale,
    });
    return new Response("Solar return reading JSON could not be parsed", { status: 502 });
  }

  if (!isSolarReturnPayload(parsed)) {
    console.error("Solar return reading JSON shape invalid", parsed);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "solar_return",
      itemKey,
      locale,
    });
    return new Response("Solar return reading JSON shape invalid", { status: 502 });
  }

  const data = {
    cards: parsed.cards,
    priorities: parsed.priorities,
  };

  await setCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "solar_return",
    itemKey,
    locale,
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
