import Anthropic from "@anthropic-ai/sdk";
import type { NatalChartData, ChartPointId } from "@/lib/chart";
import { ASPECT_LABELS, HOUSE_AREAS, POINT_LABELS } from "@/lib/chart-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

type TransitInput = {
  transitingPlanet: ChartPointId;
  natalPlanet: ChartPointId;
  aspectType: string;
  orb: number;
  strength: string;
  natalHouse?: number;
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const { chart, transits, locale } = await request.json() as { chart: NatalChartData; transits: TransitInput[]; locale?: string };

  const name = chart.event.name;
  const natalSun = chart.points.find(p => p.id === "sun");
  const natalMoon = chart.points.find(p => p.id === "moon");

  const transitLines = transits.slice(0, 6).map(t => {
    const houseDesc = t.natalHouse ? ` — ${HOUSE_AREAS[t.natalHouse] ?? `casa ${t.natalHouse}`}` : "";
    const tightness = t.strength === "tight" ? "muy exacto" : t.strength === "moderate" ? "activo" : "de fondo";
    return `- ${POINT_LABELS[t.transitingPlanet] ?? t.transitingPlanet} en ${ASPECT_LABELS[t.aspectType] ?? t.aspectType} con ${POINT_LABELS[t.natalPlanet] ?? t.natalPlanet} natal${houseDesc}. Orbe ${t.orb}°, ${tightness}.`;
  }).join("\n");
  const houseNumbers = [...new Set(transits.slice(0, 6).map((t) => t.natalHouse).filter((house): house is number => typeof house === "number"))]
    .slice(0, 3);
  const houseHint = houseNumbers.length ? houseNumbers.join(", ") : "1";

  const prompt = `Eres Sarita, una astróloga que habla con ${name} sobre lo que está pasando en su cielo ahora mismo. Directa, concreta, útil. Como una amiga que te dice qué está moviéndose en tu vida en este momento.

Carta natal de ${name}:
- Sol natal: ${natalSun ? (natalSun.sign + " casa " + natalSun.house) : "—"}
- Luna natal: ${natalMoon ? (natalMoon.sign + " casa " + natalMoon.house) : "—"}

Tránsitos activos ahora mismo:
${transitLines}

Escribe UN párrafo de 60-80 palabras. Nombra el tránsito más fuerte, di en
qué área de la vida de ${name} se va a notar y da un ejemplo real de cómo
puede aparecer en los próximos días. Termina con una recomendación concreta:
qué hacer o qué evitar ahora mismo. Sin subtítulos ni párrafos múltiples.

Después de la lectura principal, escribe exactamente esta línea de separación:

__SARITA_DATA__

Luego, en una sola línea, el JSON siguiente (sin saltos de línea dentro del JSON):

{"dominantTitle":"[Nombre del planeta tránsito] [verbo que describe qué está haciendo en la vida de ${name} ahora mismo — máx 10 palabras]","dominantBody":"[1-2 frases sobre este tránsito concreto. Qué activa. Cómo se nota. Sin misticismos.]","planetLanguage":"[1-2 frases sobre el carácter de este planeta transitante. Qué pide. Cómo trabaja.]","houses":[{"house":[número de casa],"title":"[Título evocador para esta casa en este momento — máx 8 palabras]","body":"[1-2 frases sobre qué pide esta área ahora mismo para ${name}. Concreto.]"}]}

Los valores "house" en el array deben ser los números: ${houseHint} (las casas activadas por los tránsitos más fuertes).

Reglas:
- Tono SARITA: directo, práctico, como una amiga que sabe astrología. Sin solemnidad.
- El primer carácter de cada campo de texto es siempre mayúscula
- La prosa debe respetar el párrafo único indicado antes, sin contar el JSON
- Sin listas ni subtítulos en la prosa
- Sin frases vagas ni misticismos
- El JSON debe ir en una sola línea, sin saltos de línea internos

${langInstruction(locale)}`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
      max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      let closed = false;
      const closeSafely = () => { if (!closed) { closed = true; controller.close(); } };
      const failSafely = (error: unknown) => {
        console.error("Transit reading stream failed", error);
        if (!closed) {
          closed = true;
          controller.error(error);
        }
      };
      stream.on("text", (text) => { if (!closed) controller.enqueue(encoder.encode(text)); });
      stream.finalMessage().then(closeSafely).catch(failSafely);
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" },
  });
}
