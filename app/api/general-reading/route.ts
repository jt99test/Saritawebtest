import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import type { NatalChartData } from "@/lib/chart";
import {
  getChartSummaryForPrompt,
  getThemeInstruction,
  type GeneralReadingTheme,
} from "@/lib/general-reading";
import {
  getCachedAiReading,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import { ANTHROPIC_STANDARD_READING_MODEL } from "@/lib/anthropic-models";
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

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

function buildPrompt(chart: NatalChartData, theme: GeneralReadingTheme, locale?: string, gender?: ReadingGender) {
  const chartSummary = getChartSummaryForPrompt(chart);
  const themeInstruction = getThemeInstruction(chart, theme);

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

${langInstruction(locale)}`;
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
    const itemKey = `v2:${theme}:${readingGender || "unspecified"}`;

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
    });

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

    if ((profile?.plan ?? "free") === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const prompt = buildPrompt(chart, theme, locale, readingGender);
    const message = await client.messages.create({
      model: ANTHROPIC_STANDARD_READING_MODEL,
      max_tokens: 260,
      messages: [{ role: "user", content: prompt }],
    });
    const content = extractTextContent(message);

    if (!content) {
      return new Response("Empty model response", { status: 502 });
    }

    await setCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "general",
      itemKey,
      locale,
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
