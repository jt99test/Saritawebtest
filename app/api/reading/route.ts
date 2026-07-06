import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { getApproachingHouseTransition, getApproachingSignTransition, getPointInterpretiveHouse, getPointInterpretiveSign, zodiacSigns } from "@/lib/chart";
import { ANTHROPIC_STANDARD_READING_MODEL } from "@/lib/anthropic-models";
import {
  aiGenerationStatusResponse,
  getAiGenerationStatus,
  getCachedAiReading,
  markAiReadingGenerationFailedWithReason,
  reserveAiReadingGeneration,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import { getAspectLabel, getHouseArea, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { getEffectivePlan } from "@/lib/plan-access";
import { aspectPhrase, housePhrase, nativeToneInstruction, noMajorAspects, placementPhrase, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { normalizeReadingText } from "@/lib/reading-text";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractTextContent(message: Message) {
  return message.content
    .map((block) => block.type === "text" ? block.text : "")
    .join("")
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .trim();
}

function buildPrompt(chart: NatalChartData, pointId: ChartPointId, locale?: string): string {
  const point = chart.points.find((entry) => entry.id === pointId);

  if (!point) {
    return "";
  }

  const readingSign = getPointInterpretiveSign(point);
  const signTransition = getApproachingSignTransition({ longitude: point.longitude });
  const sign = zodiacSigns.find((entry) => entry.id === readingSign);
  const signName = getSignLabel(readingSign, locale);
  const technicalSignName = getSignLabel(point.sign, locale);
  const element = sign?.element ?? "";
  const modality = sign?.modality ?? "";
  const pointReadingHouse = getPointInterpretiveHouse(point, chart.houses);
  const pointTransition = getApproachingHouseTransition({
    longitude: point.longitude,
    house: point.house,
    houses: chart.houses,
  });
  const pointHouseContext = pointTransition
    ? locale === "en"
      ? `Technically in house ${point.house}, but interpret it through house ${pointReadingHouse} because it is less than 5 degrees before that cusp.`
      : locale === "it"
        ? `Tecnicamente in casa ${point.house}, ma interpretalo attraverso la casa ${pointReadingHouse} perche e a meno di 5 gradi da quella cuspide.`
        : `Tecnicamente esta en casa ${point.house}, pero interpretalo desde la casa ${pointReadingHouse} porque esta a menos de 5 grados de esa cuspide.`
    : "";
  const pointSignContext = signTransition
    ? locale === "en"
      ? `Technically in ${technicalSignName}, but interpret it through ${signName} because it is at 29 degrees of the previous sign.`
      : locale === "it"
        ? `Tecnicamente in ${technicalSignName}, ma interpretalo attraverso ${signName} perche si trova al grado 29 del segno precedente.`
        : `Tecnicamente esta en ${technicalSignName}, pero interpretalo desde ${signName} porque esta en el grado 29 del signo anterior.`
    : "";

  const allPoints = chart.points
    .map((entry) => {
      const signLabel = getSignLabel(getPointInterpretiveSign(entry), locale);
      const readingHouse = getPointInterpretiveHouse(entry, chart.houses);
      return `- ${placementPhrase({
        point: getPointLabel(entry.id, locale),
        sign: signLabel,
        degree: entry.degreeInSign,
        house: readingHouse,
        retrograde: entry.retrograde,
        locale,
      })}`;
    })
    .join("\n");

  const pointAspects = chart.aspects
    .filter((aspect) => aspect.from === pointId || aspect.to === pointId)
    .map((aspect) => {
      const otherId = aspect.from === pointId ? aspect.to : aspect.from;
      const other = chart.points.find((entry) => entry.id === otherId);
      const otherSign = other ? getSignLabel(other.sign, locale) : "";
      const aspectName = getAspectLabel(aspect.type, locale);

      return `  - ${aspectPhrase({
        from: getPointLabel(pointId, locale),
        aspect: aspectName,
        to: `${getPointLabel(otherId, locale)} ${locale === "en" || locale === "it" ? "in" : "en"} ${otherSign}`,
        orb: aspect.orb,
        locale,
      })}`;
    })
    .join("\n");

  if (locale === "en") {
    return `You are ${chart.event.name}'s astrologer friend. Write directly, without filler and without poetic mist. Your aim is for ${chart.event.name} to read this and think, "yes, that is me."

You are reading ${chart.event.name}'s ${getPointLabel(pointId, locale)}:
${technicalSignName} ${point.degreeInSign}°, interpreted through ${signName}. ${housePhrase(pointReadingHouse, locale)} (${getHouseArea(pointReadingHouse, locale)}). ${pointSignContext} ${pointHouseContext}
${point.retrograde ? "It is retrograde." : ""}

Active aspects:
${pointAspects || noMajorAspects(locale)}

Full natal chart:
${allPoints}

Write ONE paragraph of 60-80 words. Start with a direct observation about how this planet shows up in ${chart.event.name}'s daily life. Give one concrete example from work, home, relationships, or a typical reaction. End with something useful they can do with this information. No headings, no multiple paragraphs, no poetic metaphors.
Do not start with "SARITA", with your own name, or with a technical formula like "${getPointLabel(pointId, locale)} in ${signName}, house ${pointReadingHouse}". Make the first sentence sound like a friend speaking naturally.

Internal technical data if useful: ${element} / ${modality}.

Vary the openings. Do not start with a fixed filler phrase.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}`;
  }

  if (locale === "it") {
    return `Sei l'astrologa amica di ${chart.event.name}. Scrivi in modo diretto, senza giri inutili e senza poesia nebulosa. L'obiettivo e che ${chart.event.name} legga e pensi: "si, sono proprio io."

Stai leggendo ${getPointLabel(pointId, locale)} di ${chart.event.name}:
${technicalSignName} ${point.degreeInSign}°, interpretato attraverso ${signName}. ${housePhrase(pointReadingHouse, locale)} (${getHouseArea(pointReadingHouse, locale)}). ${pointSignContext} ${pointHouseContext}
${point.retrograde ? "E retrogrado." : ""}

Aspetti attivi:
${pointAspects || noMajorAspects(locale)}

Carta natale completa:
${allPoints}

Scrivi UN paragrafo di 60-80 parole. Inizia con un'osservazione diretta su come questo pianeta si nota nella vita quotidiana di ${chart.event.name}. Fai un esempio concreto dal lavoro, dalla casa, dalle relazioni o da una reazione tipica. Chiudi con qualcosa di utile da farne. Niente titoli, niente paragrafi multipli, niente metafore poetiche.
Non iniziare con "SARITA", con il tuo nome o con una formula tecnica tipo "${getPointLabel(pointId, locale)} in ${signName}, casa ${pointReadingHouse}". La prima frase deve sembrare detta da un'amica, non da una scheda astrologica.

Dati tecnici interni se aiutano: ${element} / ${modality}.

Varia gli inizi. Non aprire con una frase riempitiva fissa.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}

IMPORTANTE: Scrivi ESCLUSIVAMENTE in italiano. Non usare spagnolo. Non usare parole spagnole come "que", "como", "cuando", "trabajo", "relaciones", "vida" o simili. Solo italiano.`;
  }

  return `Eres la astróloga amiga de ${chart.event.name}. Escribes
de forma directa, sin rodeos y sin poesía. Tu objetivo es que
${chart.event.name} lea esto y piense "claro, eso soy yo."

Estás leyendo el ${getPointLabel(pointId, locale)} de ${chart.event.name}:
${technicalSignName} ${point.degreeInSign}°, interpretado desde ${signName}. ${housePhrase(pointReadingHouse, locale)} (${getHouseArea(pointReadingHouse, locale)}). ${pointSignContext} ${pointHouseContext}
${point.retrograde ? "Está retrógrado." : ""}

Aspectos activos:
${pointAspects || noMajorAspects(locale)}

Carta natal completa:
${allPoints}

Escribe UN párrafo de 60-80 palabras. Empieza con una observación directa
sobre cómo se nota este planeta en el día a día de ${chart.event.name}. Da un ejemplo
concreto — una situación en el trabajo, en casa, en sus relaciones o en cómo
reacciona ante algo. Termina con algo que le ayude a entender qué hacer con
esto. Sin subtítulos. Sin párrafos múltiples. Sin metáforas poéticas.
No empieces con "SARITA", con tu propio nombre ni con una fórmula técnica como "${getPointLabel(pointId, locale)} en ${signName}, casa ${pointReadingHouse}". La primera frase debe sonar como una amiga hablando, no como una ficha astrológica.

Datos técnicos internos si ayudan: ${element} / ${modality}.

Varia los inicios: no empieces con "Mira", "La verdad es que", "Lo que pasa es que" ni con una muletilla fija.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}`;
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

    const { chart, pointId, locale, readingId, gender } = (await request.json()) as {
      chart: NatalChartData;
      pointId: ChartPointId;
      locale?: string;
      readingId?: string;
      gender?: ReadingGender;
    };
    const readingGender = normalizeReadingGender(gender);
    const itemKey = `v6:${pointId}:${readingGender || "unspecified"}`;

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
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });

    const cachedStatus = getAiGenerationStatus(cachedContent);
    if (cachedStatus === "generating") {
      return aiGenerationStatusResponse(cachedStatus);
    }

    if (typeof cachedContent === "string" && cachedContent.trim()) {
      return new Response(cachedContent, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (getEffectivePlan(profile, user) === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const reservation = await reserveAiReadingGeneration({
      supabase,
      user,
      readingId,
      scope: "planet",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });

    if (!reservation.ok) {
      return reservation.response;
    }

    if (!reservation.reserved) {
      const content = reservation.content;
      if (typeof content === "string" && content.trim()) {
        return new Response(content, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      return new Response("Cached reading shape invalid", { status: 500 });
    }

    const basePrompt = buildPrompt(chart, pointId, locale);

    if (!basePrompt) {
      await markAiReadingGenerationFailedWithReason({
        supabase,
        user,
        readingId,
        scope: "planet",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
        reason: "unknown_point",
      });
      return new Response("Unknown point", { status: 400 });
    }

    const prompt = `${basePrompt}\n\n${genderPromptInstruction(readingGender, locale)}\n${grammarPromptInstruction(locale)}`;

    let content = "";

    try {
      const message = await client.messages.create({
        model: ANTHROPIC_STANDARD_READING_MODEL,
        max_tokens: 350,
        messages: [{ role: "user", content: prompt }],
      });
      content = normalizeReadingText(extractTextContent(message));
      assertGeneratedLanguage(content, locale);
    } catch (error) {
      console.error("Planet reading generation failed", error);
      await markAiReadingGenerationFailedWithReason({
        supabase,
        user,
        readingId,
        scope: "planet",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
        reason: "model_or_language_error",
      });
      return new Response("Planet reading generation failed", { status: 502 });
    }

    if (!content) {
      await markAiReadingGenerationFailedWithReason({
        supabase,
        user,
        readingId,
        scope: "planet",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
        reason: "empty_model_response",
      });
      return new Response("Empty model response", { status: 502 });
    }

    await setCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "planet",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
      content,
    });

    return new Response(content, {
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


