import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

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
import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { getAspectLabel, getHouseArea, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { jsonOnlyInstruction, nativeToneInstruction, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SARITA_DATA_MARKER = "__SARITA_DATA__";

type TransitInput = {
  transitingPlanet: ChartPointId;
  natalPlanet: ChartPointId;
  aspectType: string;
  lifecycleEvent?: "jupiter-return" | "jupiter-opposition" | "saturn-return" | "saturn-opposition" | "uranus-return" | "uranus-opposition";
  orb: number;
  strength: string;
  natalHouse?: number;
  transitingHouse?: number;
  activatedNatalAspects?: Array<{
    pointA: ChartPointId;
    pointB: ChartPointId;
    aspectType: string;
    orb: number;
  }>;
};

function getLifecycleLabel(lifecycleEvent: TransitInput["lifecycleEvent"], locale?: string) {
  if (!lifecycleEvent) return "";
  const labels: Record<NonNullable<TransitInput["lifecycleEvent"]>, Record<"es" | "en" | "it", string>> = {
    "jupiter-return": {
      es: "Retorno de Júpiter",
      en: "Jupiter return",
      it: "Ritorno di Giove",
    },
    "jupiter-opposition": {
      es: "Oposición de Júpiter",
      en: "Jupiter opposition",
      it: "Opposizione di Giove",
    },
    "saturn-return": {
      es: "Retorno de Saturno",
      en: "Saturn return",
      it: "Ritorno di Saturno",
    },
    "saturn-opposition": {
      es: "Oposición de Saturno",
      en: "Saturn opposition",
      it: "Opposizione di Saturno",
    },
    "uranus-return": {
      es: "Retorno de Urano",
      en: "Uranus return",
      it: "Ritorno di Urano",
    },
    "uranus-opposition": {
      es: "Oposición de Urano",
      en: "Uranus opposition",
      it: "Opposizione di Urano",
    },
  };
  const language = locale === "en" || locale === "it" ? locale : "es";
  return labels[lifecycleEvent][language];
}

type TransitReadingPayload = {
  reading: string;
  dominantTitle: string;
  dominantBody: string;
  planetLanguage: string;
  houses: Array<{ house: number; title: string; body: string }>;
  readingGeneratedAt?: string;
};

function natalAspectTone(aspectType: string, locale?: string) {
  const challenging = aspectType === "square" || aspectType === "opposition" || aspectType === "quincunx";
  const flowing = aspectType === "trine" || aspectType === "sextile";
  if (locale === "en") {
    if (challenging) return "possible discomfort/friction";
    if (flowing) return "available support";
    return "strong inner emphasis";
  }
  if (locale === "it") {
    if (challenging) return "possibile disagio/attrito";
    if (flowing) return "sostegno disponibile";
    return "enfasi interna forte";
  }
  if (challenging) return "posible malestar/friccion";
  if (flowing) return "apoyo disponible";
  return "enfasis interno fuerte";
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

function formatNatalConditionLine(chart: NatalChartData, planetId: ChartPointId, locale?: string) {
  const natalPoint = chart.points.find((point) => point.id === planetId);
  if (!natalPoint) return null;

  const natalAspects = chart.aspects
    .filter((aspect) => aspect.from === planetId || aspect.to === planetId)
    .sort((left, right) => left.orb - right.orb)
    .map((aspect) => {
      const otherPointId = aspect.from === planetId ? aspect.to : aspect.from;
      return `${getAspectLabel(aspect.type, locale)} ${getPointLabel(otherPointId, locale)} (${natalAspectTone(aspect.type, locale)}, orb ${aspect.orb} degrees)`;
    })
    .join(", ");

  const retrogradeLabel = natalPoint.retrograde
    ? locale === "en" ? ", retrograde" : locale === "it" ? ", retrogrado" : ", retrógrado"
    : "";
  const aspectsLabel = natalAspects || (
    locale === "en" ? "no major natal aspects" : locale === "it" ? "nessun aspetto natale principale" : "sin aspectos natales principales"
  );

  if (locale === "en") {
    return `- ${getPointLabel(planetId, locale)} — natal ${getSignLabel(natalPoint.sign, locale)} house ${natalPoint.house}${retrogradeLabel}, aspects: ${aspectsLabel}.`;
  }

  if (locale === "it") {
    return `- ${getPointLabel(planetId, locale)} — natale in ${getSignLabel(natalPoint.sign, locale)} casa ${natalPoint.house}${retrogradeLabel}, aspetti: ${aspectsLabel}.`;
  }

  return `- ${getPointLabel(planetId, locale)} — natal en ${getSignLabel(natalPoint.sign, locale)} casa ${natalPoint.house}${retrogradeLabel}, aspectos: ${aspectsLabel}.`;
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
  const itemKey = `v2:${cacheKey ?? `transit:${transits.map((transit) => `${transit.transitingPlanet}-${transit.aspectType}-${transit.natalPlanet}`).join("|")}`}:${readingGender || "unspecified"}`;
  const access = await validateReadingGenerationAccess({ supabase, user, readingId });
  if (!access.ok) return access.response;

  const cachedContent = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "transit",
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
  if (!isAdminEmail(user.email) && profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const reservation = await reserveAiReadingGeneration({
    supabase,
    user,
    readingId,
    scope: "transit",
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

  const name = chart.event.name;
  const natalSun = chart.points.find((point) => point.id === "sun");
  const natalMoon = chart.points.find((point) => point.id === "moon");
  const activeTransitingPlanets = [...new Set(transits.map((transit) => transit.transitingPlanet))];
  const natalConditionLines = activeTransitingPlanets
    .map((planetId) => formatNatalConditionLine(chart, planetId, locale))
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const natalConditionSection = natalConditionLines || (
    locale === "en"
      ? "- No natal condition found for the active transiting planets."
      : locale === "it"
        ? "- Nessuna condizione natale trovata per i pianeti in transito attivi."
        : "- No se encontró condición natal para los planetas transitantes activos."
  );

  const transitLines = transits.slice(0, 6).map((transit) => {
    const natalHouseDesc = transit.natalHouse
      ? locale === "it"
        ? ` Punto natale in casa ${transit.natalHouse}: ${getHouseArea(transit.natalHouse, locale) || `casa ${transit.natalHouse}`}.`
        : locale === "en"
          ? ` Natal point in house ${transit.natalHouse}: ${getHouseArea(transit.natalHouse, locale) || `house ${transit.natalHouse}`}.`
          : ` Punto natal en casa ${transit.natalHouse}: ${getHouseArea(transit.natalHouse, locale) || `casa ${transit.natalHouse}`}.`
      : "";
    const transitHouseDesc = transit.transitingHouse
      ? locale === "it"
        ? ` La longitudine attuale del pianeta in transito cade nella casa ${transit.transitingHouse} della carta natale: ${getHouseArea(transit.transitingHouse, locale) || `casa ${transit.transitingHouse}`}.`
        : locale === "en"
          ? ` The transiting planet's current longitude falls in natal house ${transit.transitingHouse}: ${getHouseArea(transit.transitingHouse, locale) || `house ${transit.transitingHouse}`}.`
          : ` La longitud actual del planeta en transito cae en la casa ${transit.transitingHouse} de la carta natal: ${getHouseArea(transit.transitingHouse, locale) || `casa ${transit.transitingHouse}`}.`
      : "";
    const tightness = transit.strength === "tight"
      ? locale === "en" ? "very exact" : locale === "it" ? "molto esatto" : "muy exacto"
      : transit.strength === "moderate"
        ? locale === "en" ? "active" : locale === "it" ? "attivo" : "activo"
        : locale === "en" ? "background" : locale === "it" ? "di sfondo" : "de fondo";

    const natalPatterns = (transit.activatedNatalAspects ?? [])
      .map((aspect) => `${getPointLabel(aspect.pointA, locale)} ${getAspectLabel(aspect.aspectType, locale)} ${getPointLabel(aspect.pointB, locale)} natal (${natalAspectTone(aspect.aspectType, locale)}, orb ${aspect.orb} degrees)`)
      .join("; ");
    const patternDesc = natalPatterns
      ? locale === "it" ? ` Riattiva memoria natale: ${natalPatterns}.` : locale === "en" ? ` Reactivates natal memory: ${natalPatterns}.` : ` Reactiva memoria natal: ${natalPatterns}.`
      : locale === "it" ? " Non e stato rilevato un aspetto natale diretto associato a questo punto." : locale === "en" ? " No direct natal aspect associated with this point was detected." : " No se detecto un aspecto natal directo asociado a este punto.";
    const lifecycleLabel = getLifecycleLabel(transit.lifecycleEvent, locale);
    const lifecycleDesc = lifecycleLabel
      ? locale === "it" ? ` Ciclo vitale importante: ${lifecycleLabel}.` : locale === "en" ? ` Important life-cycle transit: ${lifecycleLabel}.` : ` Ciclo vital importante: ${lifecycleLabel}.`
      : "";

    return `- ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${getPointLabel(transit.transitingPlanet, locale)} ${getAspectLabel(transit.aspectType, locale)} ${getPointLabel(transit.natalPlanet, locale)} natal. Orb ${transit.orb} degrees, ${tightness}.${natalHouseDesc}${transitHouseDesc}${lifecycleDesc}${patternDesc}`;
  }).join("\n");
  const houseNumbers = [...new Set(transits.slice(0, 6)
    .map((transit) => transit.transitingHouse ?? transit.natalHouse)
    .filter((house): house is number => typeof house === "number"))]
    .slice(0, 3);
  const houseHint = houseNumbers.length ? houseNumbers.join(", ") : "1";

  const prompt = locale === "en" ? `You are Sarita, an astrologer speaking with ${name} about what is happening in their sky right now. Be direct, concrete, and useful.

${nativeToneInstruction(locale)}

${name}'s natal chart:
- Natal Sun: ${natalSun ? `${natalSun.sign} house ${natalSun.house}` : "-"}
- Natal Moon: ${natalMoon ? `${natalMoon.sign} house ${natalMoon.house}` : "-"}

Natal condition of active transiting planets:
${natalConditionSection}

Active transits now:
${transitLines}

Reading logic:
- The natal chart shows the what: patterns, deep memory, and baseline learning.
- Transits show the when: the moment those patterns become active in lived experience.
- Do not read the transit in isolation. If a transit touches a natal planet that participates in a natal aspect, interpret that aspect as an inner memory waking up.
- Use the transiting planet's house as the current area where the experience is moving, but this means the house where the transiting planet's current longitude falls inside the natal chart. Do not use the standalone transit chart's house as the life area.
- Use the natal house of the touched natal planet as the inner memory receiving the activation.
- Process the natal aspects listed as "Reactivates natal memory". Challenging natal aspects can show discomfort, pressure, anxiety, conflict, or old coping patterns; flowing natal aspects can show resources and support. Do not ignore either.
- Use the natal condition of the active transiting planet to calibrate tone: if it is well-aspected natally, lean toward its constructive expression; if it is stressed, acknowledge the friction while framing it as growth.
- Avoid punishment or fixed fate. Present the activation as a chance for awareness, integration, and a freer response.
- If there is "Reactivates natal memory", use that information in dominantBody and reading.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

${jsonOnlyInstruction(locale)}

Important: dominantBody, planetLanguage, and each houses[].body must be fuller: 3-5 concrete sentences, around 55-85 words each, so they fill roughly 3-5 lines in the card.

Exact shape:
{"reading":"[ONE paragraph of 80-110 words. Name the strongest transit, say which area of ${name}'s life it will affect, and give a real example of how it may appear in the next few days. End with one concrete recommendation.]","dominantTitle":"[Transiting planet name + verb, max 10 words]","dominantBody":"[3-5 sentences about this transit. What it activates. How it shows up. What helps. No mysticism.]","planetLanguage":"[3-4 sentences about the character of this transiting planet. What it asks for. How it works. How it feels in practice.]","houses":[{"house":[house number],"title":"[Evocative title for this house now, max 8 words]","body":"[3-5 sentences about what this area asks of ${name} now. Concrete, everyday, based on the given transits.]"}]}

The "house" values in the array must be these numbers: ${houseHint}.

Rules:
- SARITA tone: direct, practical, like a friend who knows astrology. No solemnity.
- The first character of every text field is uppercase.
- "reading" must be a single paragraph, with no lists or subtitles.
- No vague phrases or mysticism.
- Valid JSON: double quotes, no trailing commas.

${promptLanguageInstruction(locale)}` : locale === "it" ? `Sei Sarita, un'astrologa che parla con ${name} di cio che sta accadendo nel suo cielo in questo momento. Diretta, concreta, utile.

${nativeToneInstruction(locale)}

Carta natale di ${name}:
- Sole natale: ${natalSun ? `${natalSun.sign} casa ${natalSun.house}` : "-"}
- Luna natale: ${natalMoon ? `${natalMoon.sign} casa ${natalMoon.house}` : "-"}

Condizione natale dei pianeti in transito attivi:
${natalConditionSection}

Transiti attivi ora:
${transitLines}

Logica di lettura:
- La carta natale mostra il cosa: schemi, memoria profonda e apprendimenti di base.
- I transiti mostrano il quando: il momento in cui quegli schemi si attivano nell'esperienza.
- Non leggere il transito isolato. Se un transito tocca un pianeta natale coinvolto in un aspetto natale, interpreta quell'aspetto come memoria interna che si risveglia.
- Usa la casa del pianeta in transito come area attuale dell'esperienza, ma significa la casa in cui la longitudine attuale del pianeta in transito cade dentro la carta natale. Non usare la casa della carta di transito autonoma come area di vita.
- Usa la casa natale del pianeta natale toccato come memoria interna che riceve l'attivazione.
- Elabora gli aspetti natali indicati come "Riattiva memoria natale". Gli aspetti natali difficili possono mostrare disagio, pressione, ansia, conflitto o vecchi automatismi; quelli fluidi possono mostrare risorse e sostegno. Non ignorare nessuno dei due.
- Usa la condizione natale del pianeta in transito attivo per calibrare il tono: se e ben aspettato nella carta natale, privilegia l'espressione costruttiva; se e sotto tensione, riconosci l'attrito mantenendolo come crescita.
- Evita punizione o destino fisso. Presenta l'attivazione come occasione di consapevolezza, integrazione e risposta piu libera.
- Se c'e "Riattiva memoria natale", usa quell'informazione in dominantBody e in reading.

${genderPromptInstruction(readingGender, locale)}
${grammarPromptInstruction(locale)}

${jsonOnlyInstruction(locale)}

Importante: dominantBody, planetLanguage e ogni houses[].body devono essere piu sviluppati: 3-5 frasi concrete, circa 55-85 parole ciascuno, per occupare circa 3-5 righe nella card.

Forma esatta:
{"reading":"[UN paragrafo di 80-110 parole. Nomina il transito piu forte, di quale area della vita di ${name} si sentira e fai un esempio reale di come puo apparire nei prossimi giorni. Chiudi con una raccomandazione concreta.]","dominantTitle":"[Nome del pianeta in transito + verbo, max 10 parole]","dominantBody":"[3-5 frasi su questo transito concreto. Cosa attiva. Come si nota. Cosa conviene fare. Niente misticismo.]","planetLanguage":"[3-4 frasi sul carattere del pianeta in transito. Cosa chiede. Come lavora. Come si sente nella pratica.]","houses":[{"house":[numero di casa],"title":"[Titolo evocativo per questa casa ora, max 8 parole]","body":"[3-5 frasi su cosa chiede ora quest'area a ${name}. Concreto, quotidiano e basato sui transiti dati.]"}]}

I valori "house" nell'array devono essere questi numeri: ${houseHint}.

Regole:
- Tono SARITA: diretto, pratico, come un'amica che conosce l'astrologia. Senza solennita.
- Il primo carattere di ogni campo testuale e sempre maiuscolo.
- "reading" e un solo paragrafo, senza liste ne sottotitoli.
- Niente frasi vaghe ne misticismo.
- JSON valido: virgolette doppie, nessuna trailing comma.

${promptLanguageInstruction(locale)}` : `Eres Sarita, una astrologa que habla con ${name} sobre lo que esta pasando en su cielo ahora mismo. Directa, concreta, util.

Carta natal de ${name}:
- Sol natal: ${natalSun ? `${natalSun.sign} casa ${natalSun.house}` : "-"}
- Luna natal: ${natalMoon ? `${natalMoon.sign} casa ${natalMoon.house}` : "-"}

Condición natal de los planetas transitantes activos:
${natalConditionSection}

Transitos activos ahora mismo:
${transitLines}

Logica de lectura:
- La carta natal muestra el que: patrones, memoria profunda y aprendizajes de base.
- Los transitos muestran el cuando: el momento en que esos patrones se activan en la experiencia.
- No leas el transito aislado. Si un transito toca un planeta natal que participa en un aspecto natal, interpreta ese aspecto como una memoria interna que se despierta.
- Usa la casa del planeta en transito como el area actual donde se esta moviendo la experiencia, pero esto significa la casa donde la longitud actual del planeta en transito cae dentro de la carta natal. No uses la casa de la carta de transito independiente como area de vida.
- Usa la casa natal del planeta natal tocado como la memoria interna que recibe esa activacion.
- Procesa los aspectos natales indicados como "Reactiva memoria natal". Los aspectos natales tensos pueden mostrar malestar, presion, ansiedad, conflicto o patrones antiguos; los aspectos fluidos pueden mostrar recursos y apoyo. No ignores ninguno.
- Usa la condicion natal del planeta transitante activo para calibrar el tono: si esta bien aspectado natalmente, inclinate hacia su expresion constructiva; si esta tensionado, reconoce la friccion sin dejar de enmarcarla como crecimiento.
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

${promptLanguageInstruction(locale)}`;

  let parsed: unknown;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_PREMIUM_READING_MODEL,
      max_tokens: 1100,
      messages: [{ role: "user", content: prompt }],
    });
    parsed = JSON.parse(cleanJsonPayload(extractTextContent(message)));
    assertGeneratedLanguage(parsed, locale);
  } catch (error) {
    console.error("Transit reading JSON generation failed", error);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "transit",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });
    return new Response("Transit reading JSON could not be parsed", { status: 502 });
  }

  if (!isTransitReadingPayload(parsed)) {
    console.error("Transit reading JSON shape invalid", parsed);
    await markAiReadingGenerationFailed({
      supabase,
      user,
      readingId,
      scope: "transit",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });
    return new Response("Transit reading JSON shape invalid", { status: 502 });
  }

  const readingGeneratedAt = new Date().toISOString();

  await setCachedAiReading({
    supabase,
    user,
    readingId,
    scope: "transit",
    itemKey,
    locale,
    cacheUserId: access.cacheUserId,
    content: {
      ...parsed,
      readingGeneratedAt,
    },
  });

  const data = {
    dominantTitle: parsed.dominantTitle,
    dominantBody: parsed.dominantBody,
    planetLanguage: parsed.planetLanguage,
    houses: parsed.houses,
    readingGeneratedAt,
  };

  return new Response(`${parsed.reading}\n\n${SARITA_DATA_MARKER}\n${JSON.stringify(data)}`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}


