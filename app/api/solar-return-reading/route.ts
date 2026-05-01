import Anthropic from "@anthropic-ai/sdk";
import type { NatalChartData, ChartPointId, SignId } from "@/lib/chart";
import { HOUSE_AREAS, SIGN_LABELS } from "@/lib/chart-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

function signLabel(sign: SignId) {
  return SIGN_LABELS[sign] ?? sign;
}

function ascendantSign(deg: number): SignId {
  const signs: SignId[] = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
  return signs[Math.floor(((deg % 360) + 360) % 360 / 30)] ?? "aries";
}

function getPoint(chart: NatalChartData, id: ChartPointId) {
  return chart.points.find(p => p.id === id);
}

function buildContext(natal: NatalChartData, rs: NatalChartData) {
  const rsAsc = signLabel(ascendantSign(rs.meta.ascendant));
  const rsSun = getPoint(rs, "sun");
  const rsMoon = getPoint(rs, "moon");
  const rsSaturn = getPoint(rs, "saturn");
  const rsJupiter = getPoint(rs, "jupiter");
  const rsMars = getPoint(rs, "mars");
  const rsVenus = getPoint(rs, "venus");
  const natalSun = getPoint(natal, "sun");
  const natalMoon = getPoint(natal, "moon");

  const angulars = rs.points
    .filter(p => [1, 4, 7, 10].includes(p.house) && ["sun","moon","mercury","venus","mars","jupiter","saturn"].includes(p.id))
    .map(p => `${SIGN_LABELS[p.sign] ?? p.sign} en casa ${p.house}`);

  return [
    `Persona: ${natal.event.name}`,
    ``,
    `REVOLUCIÓN SOLAR:`,
    `Ascendente RS: ${rsAsc} — el tono de entrada al año`,
    rsSun ? `Sol RS: ${signLabel(rsSun.sign)}, casa ${rsSun.house} (${HOUSE_AREAS[rsSun.house] ?? "—"}) — foco principal del año` : null,
    rsMoon ? `Luna RS: ${signLabel(rsMoon.sign)}, casa ${rsMoon.house} (${HOUSE_AREAS[rsMoon.house] ?? "—"}) — tono emocional del año` : null,
    rsJupiter ? `Júpiter RS: ${signLabel(rsJupiter.sign)}, casa ${rsJupiter.house}` : null,
    rsSaturn ? `Saturno RS: ${signLabel(rsSaturn.sign)}, casa ${rsSaturn.house}` : null,
    rsMars ? `Marte RS: ${signLabel(rsMars.sign)}, casa ${rsMars.house}` : null,
    rsVenus ? `Venus RS: ${signLabel(rsVenus.sign)}, casa ${rsVenus.house}` : null,
    angulars.length ? `Angulares RS: ${angulars.join(", ")}` : null,
    ``,
    `CARTA NATAL (base):`,
    natalSun ? `Sol natal: ${signLabel(natalSun.sign)}, casa ${natalSun.house}` : null,
    natalMoon ? `Luna natal: ${signLabel(natalMoon.sign)}, casa ${natalMoon.house}` : null,
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "avanzado") return new Response("Advanced plan required", { status: 403 });

  const { natalChartData, solarReturnData, locale } = await request.json() as {
    natalChartData: NatalChartData;
    solarReturnData: NatalChartData;
    locale?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });

  const name = natalChartData.event.name;
  const context = buildContext(natalChartData, solarReturnData);

  const prompt = `Eres Sarita, una astróloga que habla con ${name} como lo haría una amiga muy bien informada. Directo, claro, útil. Sin frases vagas ni misticismos. Solo información concreta sobre lo que le toca este año.

${context}

Escribe UN párrafo de 80-100 palabras sobre el año de ${name}. Usa el
Ascendente RS y el Sol RS para decir cuál es el tema central del año. Da un
ejemplo concreto de cómo puede notarlo en su vida. Termina con una o dos
cosas prácticas que le ayudarán a aprovechar bien este año. Sin subtítulos
ni párrafos múltiples.

Después de la lectura principal, escribe exactamente esta línea de separación:

__SARITA_DATA__

Luego, en una sola línea, el JSON siguiente:

{"cards":[{"key":"theme","title":"[Título breve para el tema del año — máx 6 palabras]","body":"[1-2 frases sobre qué pide el año según el Ascendente RS y el tono general]"},{"key":"area","title":"[Título breve sobre el área de vida principal — máx 6 palabras]","body":"[1-2 frases sobre el Sol RS: qué área de vida pide foco y cómo se nota]"},{"key":"tone","title":"[Título breve sobre el tono emocional — máx 6 palabras]","body":"[1-2 frases sobre la Luna RS: qué necesidades internas van a estar más presentes]"}],"priorities":[{"title":"[Acción o área de prioridad 1 — máx 7 palabras]","body":"[1-2 frases concretas sobre qué hacer / cómo enfocarlo este año]"},{"title":"[Acción o área de prioridad 2 — máx 7 palabras]","body":"[1-2 frases concretas]"},{"title":"[Acción o área de prioridad 3 — máx 7 palabras]","body":"[1-2 frases concretas]"}]}

Las 3 prioridades deben nacer directamente de los datos: Ascendente RS, Sol RS, Luna RS. No consejos genéricos.

Reglas estrictas:
- La respuesta empieza directamente, sin presentarte ni saludar
- El primer carácter es siempre mayúscula
- La prosa debe respetar el párrafo único indicado antes
- Sin listas ni subtítulos en la prosa
- Que parezca escrito para esta persona, no una plantilla
- Tono SARITA: directo, práctico, como una amiga que sabe astrología. Sin solemnidad.
- Reglas para el JSON: primer carácter de cada campo de texto siempre mayúscula, sin misticismos, una sola línea de JSON sin saltos de línea internos

${langInstruction(locale)}`;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
      max_tokens: 1100,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      let closed = false;
      const closeSafely = () => { if (!closed) { closed = true; controller.close(); } };
      const failSafely = (error: unknown) => {
        console.error("Solar return reading stream failed", error);
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
