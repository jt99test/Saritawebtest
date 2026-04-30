import Anthropic from "@anthropic-ai/sdk";

import type { NatalChartData } from "@/lib/chart";
import {
  getChartSummaryForPrompt,
  getThemeInstruction,
  type GeneralReadingTheme,
} from "@/lib/general-reading";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

function buildPrompt(chart: NatalChartData, theme: GeneralReadingTheme, locale?: string) {
  const chartSummary = getChartSummaryForPrompt(chart);
  const themeInstruction = getThemeInstruction(chart, theme);

  return `Eres una astróloga amiga de ${chart.event.name} que le está explicando su carta natal por encima de un café. Conoces bien la astrología, pero ahora mismo no estás en modo "astróloga profesional" — estás en modo "amiga que se la sabe y se la está traduciendo a alguien que confía en ti". Tu lectura tiene que sentirse así: cercana, directa, útil, con ejemplos concretos de cómo esta energía aparece en su día a día.

Estás escribiendo una sección temática de la lectura general de la carta natal de ${chart.event.name}, nacido/a el ${chart.event.dateLabel} en ${chart.event.locationLabel}.

Contexto astrológico completo de la persona:
${chartSummary}

${themeInstruction}

Voice and format requirements for all 6 prompts:
- Habla como una amiga, no como una astróloga solemne ni literaria.
- Dirígete a ${chart.event.name} por su nombre al principio de la lectura. Debe aparecer al menos una vez.
- Usa "tú" siempre, en español de España.
- Usa formulaciones cotidianas, claras y directas.
- Da ejemplos de cómo esto se nota en su vida diaria: vínculos, trabajo, estrés, decisiones, hábitos.
- Puedes señalar dificultades con claridad.
- Evita por completo metáforas poéticas y frases literarias.
- No empieces con "Tu Sol en..." ni con estructuras impersonales. Empieza con "${chart.event.name}, tienes..." o equivalente.

Formato:
- 3 párrafos fluidos, sin subtítulos.
- 350-500 palabras.
- Cierra con una observación práctica o útil.

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if ((profile?.plan ?? "free") === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const { chart, theme, locale } = (await request.json()) as {
      chart: NatalChartData;
      theme: GeneralReadingTheme;
      locale?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    if (!theme) {
      return new Response("Unknown theme", { status: 400 });
    }

    const prompt = buildPrompt(chart, theme, locale);
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const closeSafely = () => {
          if (closed) {
            return;
          }

          closed = true;
          controller.close();
        };

        stream.on("text", (text) => {
          if (!closed) {
            controller.enqueue(encoder.encode(text));
          }
        });

        stream.finalMessage().then(closeSafely).catch(closeSafely);
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
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
