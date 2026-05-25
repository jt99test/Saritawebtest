import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { isAdminEmail } from "@/lib/admin";

import type { NatalChartData } from "@/lib/chart";
import {
  getChartSummaryForPrompt,
  getThemeInstruction,
  type GeneralReadingTheme,
} from "@/lib/general-reading";
import {
  aiGenerationStatusResponse,
  getAiGenerationStatus,
  getCachedAiReading,
  markAiReadingGenerationFailed,
  reserveAiReadingGeneration,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import { ANTHROPIC_STANDARD_READING_MODEL } from "@/lib/anthropic-models";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { nativeToneInstruction, promptLanguageInstruction } from "@/lib/prompt-i18n";
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
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ZODIAC_REPLACEMENTS = {
  en: [
    ["Tauro", "Taurus"],
    ["Géminis", "Gemini"],
    ["Geminis", "Gemini"],
    ["Cáncer", "Cancer"],
    ["Escorpio", "Scorpio"],
    ["Sagitario", "Sagittarius"],
    ["Capricornio", "Capricorn"],
    ["Acuario", "Aquarius"],
    ["Piscis", "Pisces"],
  ],
  it: [
    ["Aries", "Ariete"],
    ["Tauro", "Toro"],
    ["Géminis", "Gemelli"],
    ["Geminis", "Gemelli"],
    ["Cáncer", "Cancro"],
    ["Cancer", "Cancro"],
    ["Leo", "Leone"],
    ["Virgo", "Vergine"],
    ["Libra", "Bilancia"],
    ["Escorpio", "Scorpione"],
    ["Sagitario", "Sagittario"],
    ["Capricornio", "Capricorno"],
    ["Acuario", "Acquario"],
    ["Piscis", "Pesci"],
  ],
} as const;

function normalizeGeneratedLanguage(content: string, locale?: string) {
  if (locale !== "en" && locale !== "it") {
    return content;
  }

  return ZODIAC_REPLACEMENTS[locale].reduce((nextContent, [source, target]) => {
    const articlePattern = new RegExp(`\\b(?:el|la|los|las|the)\\s+${escapeRegExp(source)}\\b`, "gi");
    const barePattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, "g");
    return nextContent.replace(articlePattern, target).replace(barePattern, target);
  }, content).replace(/\s{2,}/g, " ").trim();
}

function buildPrompt(chart: NatalChartData, theme: GeneralReadingTheme, locale?: string, gender?: ReadingGender) {
  const chartSummary = getChartSummaryForPrompt(chart, locale);
  const themeInstruction = getThemeInstruction(chart, theme, locale);

  if (locale === "en") {
    return `You are ${chart.event.name}'s astrologer friend, explaining their natal chart over coffee. You know astrology well, but you are not performing as a formal professional; you are the friend who understands the chart and translates it into useful, concrete language. The reading should feel close, direct, and practical, with examples from everyday life.

You are writing one thematic section of ${chart.event.name}'s general natal reading. Birth date: ${chart.event.dateLabel}. Birthplace: ${chart.event.locationLabel}.

Full astrological context:
${chartSummary}

${themeInstruction}

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

Write ONE paragraph of 60-80 words about this specific chart theme. Identify how it appears in daily life with one real, concrete example. End with something ${chart.event.name} can do or keep in mind. Vary the opening; do not begin with a fixed filler phrase. No headings, no multiple paragraphs.

No markdown. No headings. Do not start with "#". Respect the limit strictly: 60-80 words.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}`;
  }

  if (locale === "it") {
    return `Sei l'astrologa amica di ${chart.event.name} e stai spiegando la sua carta natale davanti a un caffe. Conosci bene l'astrologia, ma non sei in modalita professionista distante: sei l'amica che capisce la carta e la traduce in parole utili, concrete e vicine. La lettura deve sentirsi diretta, pratica e quotidiana.

Stai scrivendo una sezione tematica della lettura generale della carta natale di ${chart.event.name}. Data di nascita: ${chart.event.dateLabel}. Luogo di nascita: ${chart.event.locationLabel}.

Contesto astrologico completo:
${chartSummary}

${themeInstruction}

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

Scrivi UN paragrafo di 60-80 parole su questo tema specifico della carta. Mostra come si manifesta nella vita quotidiana con un esempio reale e concreto. Chiudi con qualcosa che ${chart.event.name} possa fare o tenere presente. Varia l'inizio; non aprire con una frase riempitiva fissa. Niente titoli, niente paragrafi multipli.

Niente markdown. Niente intestazioni. Non iniziare con "#". Rispetta il limite in modo stretto: 60-80 parole.

IMPORTANTE: Scrivi ESCLUSIVAMENTE in italiano. Non usare spagnolo. Non usare parole spagnole come "que", "como", "cuando", "trabajo", "relaciones", "vida" o simili. Solo italiano.

${nativeToneInstruction(locale)}
${promptLanguageInstruction(locale)}`;
  }

  return `Eres una astróloga amiga de ${chart.event.name} que le está explicando su carta natal por encima de un café. Conoces bien la astrología, pero ahora mismo no estás en modo "astróloga profesional" — estás en modo "amiga que se la sabe y se la está traduciendo a alguien que confía en ti". Tu lectura tiene que sentirse así: cercana, directa, útil, con ejemplos concretos de cómo esto aparece en su día a día.

Estás escribiendo una sección temática de la lectura general de la carta natal de ${chart.event.name}, nacido/a el ${chart.event.dateLabel} en ${chart.event.locationLabel}.

Contexto astrológico completo de la persona:
${chartSummary}

${themeInstruction}

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

Escribe UN párrafo de 60-80 palabras sobre este tema específico de la carta
de ${chart.event.name}. Identifica cómo se manifiesta en su vida cotidiana con un ejemplo
real y concreto. Termina con algo que pueda hacer o tener en cuenta. Varia el inicio de cada lectura: no empieces con "Mira", "La verdad es que", "Lo que pasa es que" ni con una muletilla fija. Sin
subtítulos, sin párrafos múltiples.

No uses markdown. No uses encabezados. No empieces con "#". Respeta estrictamente el lÃ­mite: 60-80 palabras.

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

    const { chart, theme, locale, readingId, gender } = (await request.json()) as {
      chart: NatalChartData;
      theme: GeneralReadingTheme;
      locale?: string;
      readingId?: string;
      gender?: ReadingGender;
    };
    const readingGender = normalizeReadingGender(gender);
    const itemKey = `v8:${theme}:${readingGender || "unspecified"}`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    if (!theme) {
      return new Response("Unknown theme", { status: 400 });
    }

    const access = await validateReadingGenerationAccess({ supabase, user, readingId });
    if (!access.ok) {
      return access.response;
    }

    const cachedContent = await getCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "general",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });

    const cachedStatus = getAiGenerationStatus(cachedContent);
    if (cachedStatus) {
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

    if (!isAdminEmail(user.email) && (profile?.plan ?? "free") === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const reservation = await reserveAiReadingGeneration({
      supabase,
      user,
      readingId,
      scope: "general",
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

    const prompt = buildPrompt(chart, theme, locale, readingGender);
    let content = "";

    try {
      const message = await client.messages.create({
        model: ANTHROPIC_STANDARD_READING_MODEL,
        max_tokens: 260,
        messages: [{ role: "user", content: prompt }],
      });
      content = normalizeGeneratedLanguage(extractTextContent(message), locale);
      assertGeneratedLanguage(content, locale);
    } catch (error) {
      console.error("General reading generation failed", error);
      await markAiReadingGenerationFailed({
        supabase,
        user,
        readingId,
        scope: "general",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
      });
      return new Response("General reading generation failed", { status: 502 });
    }

    if (!content) {
      await markAiReadingGenerationFailed({
        supabase,
        user,
        readingId,
        scope: "general",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
      });
      return new Response("Empty model response", { status: 502 });
    }

    await setCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "general",
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
    console.error("General reading API error:", error);
    return new Response("Internal error", { status: 500 });
  }
}


