import Anthropic from "@anthropic-ai/sdk";

import type { NatalChartData } from "@/lib/chart";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
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

  const { natalChartData, solarReturnData } = (await request.json()) as {
    natalChartData: NatalChartData;
    solarReturnData: NatalChartData;
    locale?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const prompt = `Eres SARITA, astróloga psicológica con voz cálida, directa y precisa. La carta no es destino: es potencial y conciencia.

Lee la Revolución Solar de ${natalChartData.event.name}. Enfócate en la intención del alma para el año, sin clichés.

Carta natal: ${JSON.stringify(natalChartData).slice(0, 9000)}
Revolución Solar: ${JSON.stringify(solarReturnData).slice(0, 9000)}

Escribe en español, 4 párrafos fluidos, sin subtítulos.`;

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
        if (!closed) {
          closed = true;
          controller.close();
        }
      };
      stream.on("text", (text) => {
        if (!closed) controller.enqueue(encoder.encode(text));
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
}
