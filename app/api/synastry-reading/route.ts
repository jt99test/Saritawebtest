import Anthropic from "@anthropic-ai/sdk";
import type { NatalChartData, ChartPointId } from "@/lib/chart";
import type { SynastryAspect } from "@/lib/synastry";
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
  pluto: "Plutón", northNode: "Nodo Norte",
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: "conjunción", trine: "trígono", sextile: "sextil",
  square: "cuadratura", opposition: "oposición", quincunx: "quincuncio",
};

const SIGN_LABELS: Record<string, string> = {
  aries: "Aries", taurus: "Tauro", gemini: "Géminis", cancer: "Cáncer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Escorpio",
  sagittarius: "Sagitario", capricorn: "Capricornio", aquarius: "Acuario", pisces: "Piscis",
};

function pl(id: ChartPointId) { return POINT_LABELS[id] ?? id; }
function sl(sign: string) { return SIGN_LABELS[sign] ?? sign; }

function keyPoints(chart: NatalChartData) {
  const get = (id: ChartPointId) => chart.points.find(p => p.id === id);
  const sun = get("sun"); const moon = get("moon");
  const venus = get("venus"); const mars = get("mars");
  return [
    sun ? `Sol ${sl(sun.sign)} casa ${sun.house}` : null,
    moon ? `Luna ${sl(moon.sign)} casa ${moon.house}` : null,
    venus ? `Venus ${sl(venus.sign)}` : null,
    mars ? `Marte ${sl(mars.sign)}` : null,
  ].filter(Boolean).join(" · ");
}

function buildContext(chartA: NatalChartData, chartB: NatalChartData, partnerName: string, aspects: SynastryAspect[]) {
  const topAspects = [...aspects]
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 10)
    .map(a => {
      const quality = a.quality === "harmonious" ? "armónico" : a.quality === "tense" ? "tenso" : "neutro";
      return `- ${pl(a.pointA)} (${chartA.event.name}) en ${ASPECT_LABELS[a.type] ?? a.type} con ${pl(a.pointB)} (${partnerName}) — orbe ${a.orb}°, ${quality}`;
    });

  return [
    `${chartA.event.name}: ${keyPoints(chartA)}`,
    `${partnerName}: ${keyPoints(chartB)}`,
    ``,
    `Aspectos más fuertes (ordenados por orbe):`,
    ...topAspects,
  ].join("\n");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const { chartA, chartB, partnerName, aspects, locale } = await request.json() as {
    chartA: NatalChartData; chartB: NatalChartData;
    partnerName: string; aspects: SynastryAspect[];
    locale?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });

  const name = chartA.event.name;
  const context = buildContext(chartA, chartB, partnerName, aspects);

  const prompt = `Eres Sarita, una astróloga que habla con ${name} sobre su relación con ${partnerName}. Directa y concreta. Como una amiga que entiende de astro y te dice lo que ve, sin endulzarlo.

${context}

Escribe 3 párrafos. Cada uno responde a una pregunta real:

Párrafo 1 — La dinámica central: ¿Qué siente ${name} con ${partnerName} y por qué? Usa los 2-3 aspectos más fuertes. Explica en qué se nota en la vida real: en la conversación, la atracción, los momentos de fricción.

Párrafo 2 — Lo que funciona y lo que tensa: Menciona aspectos armónicos concretos y di qué facilitan. Luego aspectos tensos y di qué fricciones generan. No como algo malo, sino como una descripción honesta de cómo funciona esta relación.

Párrafo 3 — Lo que puede hacer ${name}: Qué actitud o acción concreta le ayuda a llevarse mejor con ${partnerName} según estos aspectos. Que nazca de los datos, no un consejo genérico.

Después de los 3 párrafos, escribe exactamente esta línea de separación:

__SARITA_DATA__

Luego, en una sola línea, el JSON siguiente:

{"compatibilityLabel":"[Etiqueta corta que describe esta relación — máx 6 palabras, sin clichés]","compatibilityDescription":"[1-2 frases que expliquen el tipo de vínculo de forma honesta y directa. Sin el cosmos ni karma.]","layers":{"fisico":"[2-3 frases sobre la conexión física/corporal entre ${name} y ${partnerName} según los aspectos. Qué se activa. Cómo se nota.]","sexual":"[2-3 frases sobre la dimensión sexual: atracción, deseo, intensidad. Concreto y directo.]","emocional":"[2-3 frases sobre la capa emocional: apego, seguridad, vulnerabilidad. Basado en los aspectos reales.]","mental":"[2-3 frases sobre la conexión mental: comunicación, ideas, perspectivas compartidas o en conflicto.]","profesional":"[2-3 frases sobre si pueden trabajar juntos, construir algo, qué dinámicas de poder aparecen.]","evolutivo":"[2-3 frases sobre qué le enseña esta relación a ${name}: qué patrones activa, qué empuja a cambiar.]"}}

Cada valor del JSON usa los aspectos reales de la carta comparada. No genérico.
Primera letra de cada campo siempre mayúscula.
Una sola línea de JSON, sin saltos de línea dentro del JSON.

Reglas estrictas:
- Habla siempre a ${name} directamente
- El primer carácter es siempre mayúscula
- Máximo 380 palabras
- Español de España, tuteo
- Sin listas, sin subtítulos, prosa fluida en 3 párrafos separados por línea en blanco
- Tono SARITA: directo, práctico, como una amiga que sabe astrología. Sin solemnidad.
- Sin palabras como "espejos", "karma", "cosmos", "universo", "el cielo te invita", "energía cósmica" ni lenguaje New Age

${langInstruction(locale)}`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1400,
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
