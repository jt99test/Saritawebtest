import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { isAdminEmail } from "@/lib/admin";

import { ANTHROPIC_PREMIUM_READING_MODEL } from "@/lib/anthropic-models";
import {
  aiGenerationStatusResponse,
  getAiGenerationStatus,
  getCachedAiReading,
  markAiReadingGenerationFailedWithReason,
  reserveAiReadingGeneration,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import type { ChartPointId, NatalChartData, SignId } from "@/lib/chart";
import { getPointInterpretiveHouse } from "@/lib/chart";
import { getAspectLabel, getHouseArea, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { jsonOnlyInstruction, nativeToneInstruction, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { calculateSynastryAspects } from "@/lib/synastry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type SolarReturnPayload = {
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
  const houseOf = (chart: NatalChartData, point: NonNullable<ReturnType<typeof getPoint>>) => getPointInterpretiveHouse(point, chart.houses);

  const angulars = rs.points
    .filter((point) => [1, 4, 7, 10].includes(houseOf(rs, point)) && ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].includes(point.id))
    .map((point) => `${getSignLabel(point.sign, locale)} in house ${houseOf(rs, point)}`);
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
    rsSun ? `Solar Return Sun: ${signLabel(rsSun.sign, locale)}, house ${houseOf(rs, rsSun)} (${getHouseArea(houseOf(rs, rsSun), locale) || "-"}) - main yearly focus` : null,
    rsMoon ? `Solar Return Moon: ${signLabel(rsMoon.sign, locale)}, house ${houseOf(rs, rsMoon)} (${getHouseArea(houseOf(rs, rsMoon), locale) || "-"}) - emotional tone of the year` : null,
    rsJupiter ? `Solar Return Jupiter: ${signLabel(rsJupiter.sign, locale)}, house ${houseOf(rs, rsJupiter)}` : null,
    rsSaturn ? `Solar Return Saturn: ${signLabel(rsSaturn.sign, locale)}, house ${houseOf(rs, rsSaturn)}` : null,
    rsMars ? `Solar Return Mars: ${signLabel(rsMars.sign, locale)}, house ${houseOf(rs, rsMars)}` : null,
    rsVenus ? `Solar Return Venus: ${signLabel(rsVenus.sign, locale)}, house ${houseOf(rs, rsVenus)}` : null,
    angulars.length ? `Angulares RS: ${angulars.join(", ")}` : null,
    rsAspects.length ? `Aspectos principales RS: ${rsAspects.join("; ")}` : null,
    natalSolarAspects.length ? `Aspectos RS a carta natal: ${natalSolarAspects.join("; ")}` : null,
    "",
    "CARTA NATAL:",
    natalSun ? `Natal Sun: ${signLabel(natalSun.sign, locale)}, house ${houseOf(natal, natalSun)}` : null,
    natalMoon ? `Natal Moon: ${signLabel(natalMoon.sign, locale)}, house ${houseOf(natal, natalMoon)}` : null,
  ].filter(Boolean).join("\n");
}

function buildPrompt({
  name,
  context,
  locale,
  readingGender,
}: {
  name: string;
  context: string;
  locale?: string;
  readingGender?: ReadingGender;
}) {
  if (locale === "en") {
    return `You are Sarita, an astrologer speaking to ${name} like a very informed friend. Direct, clear, practical. No vague lines and no mysticism.

${context}

Solar Return reading logic:
- The natal chart is the ground: deep memory, base patterns, and the main meaning.
- The Solar Return does not replace or contradict the natal chart; it shows the yearly setting where that ground unfolds.
- Always read the Solar Return in dialogue with the natal chart: Solar Return Sun, Moon, Ascendant, and angular planets show how and where the natal learning activates this year.
- Do not present the reading as fatalistic prediction. Present it as a process, developmental climate, and awareness guide for living the year with more presence.
- If a Solar Return house is emphasized, explain the yearly area; if a Solar Return planet is angular or highlighted, explain what experience wants to become visible.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}
${nativeToneInstruction(locale)}
${jsonOnlyInstruction(locale)}

Important: the three cards[].body fields (theme, area, tone) must be long: 4-5 concrete sentences, about 70-95 words each, so they fill roughly 5-6 lines in the card.

Exact shape:
{"cards":[{"key":"theme","title":"[Short title for the year's theme, max 6 words]","body":"[4-5 practical sentences about Solar Return Ascendant and the general tone. What changes, how it shows up, what to observe, and one concrete action.]"},{"key":"area","title":"[Short title for the main area, max 6 words]","body":"[4-5 practical sentences about Solar Return Sun: focus area, how it shows up, what it asks them to sustain, and a daily example.]"},{"key":"tone","title":"[Short title for the emotional tone, max 6 words]","body":"[4-5 practical sentences about Solar Return Moon: inner needs, possible emotional reaction, care, and concrete recommendation.]"}],"priorities":[{"title":"[Priority 1, max 7 words]","body":"[3-4 concrete sentences about what to do this year]"},{"title":"[Priority 2, max 7 words]","body":"[3-4 concrete sentences]"},{"title":"[Priority 3, max 7 words]","body":"[3-4 concrete sentences]"}]}

Rules:
- The 3 priorities come from Solar Return Ascendant, Sun, and Moon.
- Nothing generic. Every field must use the data given.
- The first character of every text field is uppercase.
- Valid JSON: double quotes, no trailing commas.

${langInstruction(locale)}`;
  }

  if (locale === "it") {
    return `Sei Sarita, un'astrologa che parla con ${name} come un'amica molto preparata. Diretta, chiara, pratica. Niente frasi vaghe e niente misticismi.

${context}

Logica della lettura di Rivoluzione Solare:
- La carta natale e il terreno: memoria profonda, schemi di base e significato principale.
- La Rivoluzione Solare non sostituisce ne contraddice la carta natale; mostra lo scenario annuale in cui quel terreno si dispiega.
- Leggi sempre la Rivoluzione Solare in dialogo con la carta natale: Sole RS, Luna RS, Ascendente RS e pianeti angolari mostrano come e dove si attiva l'apprendimento natale durante l'anno.
- Non presentare la lettura come previsione fatalista. Presentala come processo, clima evolutivo e guida di consapevolezza per vivere l'anno con piu presenza.
- Se una casa RS e enfatizzata, spiega l'area annuale; se un pianeta RS e angolare o forte, spiega quale esperienza cerca di diventare visibile.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}
${nativeToneInstruction(locale)}
${jsonOnlyInstruction(locale)}

Importante: i tre campi cards[].body (theme, area e tone) devono essere lunghi: 4-5 frasi concrete, circa 70-95 parole ciascuno, cosi occupano circa 5-6 righe nella scheda.

Forma esatta:
{"cards":[{"key":"theme","title":"[Titolo breve del tema dell'anno, max 6 parole]","body":"[4-5 frasi pratiche sull'Ascendente RS e sul tono generale. Che cosa cambia, come si nota, che cosa osservare e un'azione concreta.]"},{"key":"area","title":"[Titolo breve dell'area principale, max 6 parole]","body":"[4-5 frasi pratiche sul Sole RS: area di focus, come si nota, che cosa chiede di sostenere e un esempio quotidiano.]"},{"key":"tone","title":"[Titolo breve del tono emotivo, max 6 parole]","body":"[4-5 frasi pratiche sulla Luna RS: bisogni interni, possibile reazione emotiva, cura e raccomandazione concreta.]"}],"priorities":[{"title":"[Priorita 1, max 7 parole]","body":"[3-4 frasi concrete su che cosa fare quest'anno]"},{"title":"[Priorita 2, max 7 parole]","body":"[3-4 frasi concrete]"},{"title":"[Priorita 3, max 7 parole]","body":"[3-4 frasi concrete]"}]}

Regole:
- Le 3 priorita nascono da Ascendente RS, Sole RS e Luna RS.
- Nulla di generico. Ogni campo deve usare i dati forniti.
- Il primo carattere di ogni campo di testo e maiuscolo.
- JSON valido: virgolette doppie, senza trailing comma.

${langInstruction(locale)}`;
  }

  return `Eres Sarita, una astrÃ³loga que habla con ${name} como una amiga muy bien informada. Directa, clara, prÃ¡ctica. Sin frases vagas ni misticismos.

${context}

Logica de lectura de Revolucion Solar:
- La carta natal es el terreno: memoria profunda, patrones de base y significado principal.
- La Revolucion Solar no sustituye ni contradice la carta natal; muestra el escenario anual donde ese terreno se despliega.
- Lee la RS siempre en dialogo con la carta natal: el Sol RS, la Luna RS, el Ascendente RS y los planetas angulares muestran como y donde se activa el aprendizaje natal durante este ano.
- No presentes la lectura como prediccion fatalista. Presentala como proceso, clima evolutivo y guia de conciencia para vivir el ano con mas presencia.
- Si una casa RS esta enfatizada, explica el area anual; si un planeta RS esta angular o destacado, explica que experiencia busca volverse visible.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}
${jsonOnlyInstruction(locale)}

Importante: los tres campos cards[].body (theme, area y tone) deben ser largos: 4-5 frases concretas, unas 70-95 palabras cada uno, para que ocupen aproximadamente 5-6 lineas en la tarjeta.

Forma exacta:
{"cards":[{"key":"theme","title":"[Titulo breve del tema del ano, max 6 palabras]","body":"[4-5 frases practicas sobre el Ascendente RS y el tono general. Que cambia, como se nota, que observar y una accion concreta.]"},{"key":"area","title":"[Titulo breve del area principal, max 6 palabras]","body":"[4-5 frases practicas sobre el Sol RS: area de foco, como se nota, que pide sostener y un ejemplo cotidiano.]"},{"key":"tone","title":"[Titulo breve del tono emocional, max 6 palabras]","body":"[4-5 frases practicas sobre la Luna RS: necesidades internas, reaccion emocional posible, cuidado y recomendacion concreta.]"}],"priorities":[{"title":"[Prioridad 1, max 7 palabras]","body":"[3-4 frases concretas sobre que hacer este ano]"},{"title":"[Prioridad 2, max 7 palabras]","body":"[3-4 frases concretas]"},{"title":"[Prioridad 3, max 7 palabras]","body":"[3-4 frases concretas]"}]}

Reglas:
- Las 3 prioridades nacen de Ascendente RS, Sol RS y Luna RS.
- Nada generico. Cada campo debe usar los datos dados.
- El primer caracter de cada campo de texto siempre es mayuscula.
- JSON valido: comillas dobles, sin trailing commas.

${langInstruction(locale)}`;
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
  const itemKey = `v5:${cacheKey ?? `solar-return:${solarReturnData.meta.solarReturnYear ?? solarReturnData.event.title}`}:${readingGender || "unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "solar_return",
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
    scope: "solar_return",
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

  const name = natalChartData.event.name;
  const context = buildContext(natalChartData, solarReturnData, locale);

  const prompt = buildPrompt({ name, context, locale, readingGender });

  let parsed: unknown;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 1700,
      messages: [{ role: "user", content: prompt }],
    });
    parsed = JSON.parse(cleanJsonPayload(extractTextContent(message)));
    assertGeneratedLanguage(parsed, locale);
  } catch (error) {
    console.error("Solar return reading JSON generation failed", error);
    await markAiReadingGenerationFailedWithReason({
      supabase,
      user,
      readingId,
      scope: "solar_return",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
      reason: "json_generation_or_language_error",
    });
    return new Response("Solar return reading JSON could not be parsed", { status: 502 });
  }

  if (!isSolarReturnPayload(parsed)) {
    console.error("Solar return reading JSON shape invalid", parsed);
    await markAiReadingGenerationFailedWithReason({
      supabase,
      user,
      readingId,
      scope: "solar_return",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
      reason: "invalid_json_shape",
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


