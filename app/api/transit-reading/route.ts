import Anthropic from "@anthropic-ai/sdk";
import type { NatalChartData, ChartPointId } from "@/lib/chart";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

const POINT_LABELS: Partial<Record<ChartPointId, string>> = {
  sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte",
  jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno",
  pluto: "Plutón", northNode: "Nodo Norte", southNode: "Nodo Sur", chiron: "Quirón",
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: "conjunción", trine: "trígono", sextile: "sextil",
  square: "cuadratura", opposition: "oposición", quincunx: "quincuncio",
};

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad y cuerpo", 2: "dinero y recursos", 3: "comunicación y mente",
  4: "hogar y familia", 5: "creatividad y placer", 6: "trabajo y salud",
  7: "pareja y vínculos", 8: "transformación e intimidad", 9: "viajes y sentido",
  10: "carrera y vocación", 11: "amigos y proyectos", 12: "descanso e inconsciente",
};

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

Escribe 2 párrafos concretos dirigidos a ${name}:

Párrafo 1 — Qué está pasando ahora: Explica el tránsito más fuerte. Di qué área de vida está siendo activada y cómo puede notarlo en el día a día. Da un ejemplo real.

Párrafo 2 — Qué hacer con esto: Una recomendación práctica para este momento concreto. Qué conviene hacer, qué conviene evitar.

Después de los 2 párrafos, escribe exactamente esta línea de separación:

__SARITA_DATA__

Luego, en una sola línea, el JSON siguiente (sin saltos de línea dentro del JSON):

{"dominantTitle":"[Nombre del planeta tránsito] [verbo que describe qué está haciendo en la vida de ${name} ahora mismo — máx 10 palabras]","dominantBody":"[1-2 frases sobre este tránsito concreto. Qué activa. Cómo se nota. Sin misticismos.]","planetLanguage":"[1-2 frases sobre el carácter de este planeta transitante. Qué pide. Cómo trabaja.]","houses":[{"house":[número de casa],"title":"[Título evocador para esta casa en este momento — máx 8 palabras]","body":"[1-2 frases sobre qué pide esta área ahora mismo para ${name}. Concreto.]"}]}

Los valores "house" en el array deben ser los números: ${houseHint} (las casas activadas por los tránsitos más fuertes).

Reglas:
- Tono SARITA: directo, práctico, como una amiga que sabe astrología. Sin solemnidad.
- El primer carácter de cada campo de texto es siempre mayúscula
- Máximo 300 palabras en los párrafos de prosa, sin contar el JSON
- Sin listas ni subtítulos en la prosa
- Sin "el universo te pide", "el cosmos", "el cielo te invita", "karma", "energía cósmica" ni misticismos
- El JSON debe ir en una sola línea, sin saltos de línea internos

${langInstruction(locale)}`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      let closed = false;
      const closeSafely = () => { if (!closed) { closed = true; controller.close(); } };
      stream.on("text", (text) => { if (!closed) controller.enqueue(encoder.encode(text)); });
      stream.finalMessage().then(closeSafely).catch(closeSafely);
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" },
  });
}
