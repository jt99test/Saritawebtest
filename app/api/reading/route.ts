import Anthropic from "@anthropic-ai/sdk";

import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { zodiacSigns } from "@/lib/chart";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English.";
  if (locale === "it") return "Write entirely in Italian.";
  return "Write in Spanish from Spain. Use the 'tú' form.";
}

const SIGN_LABELS = {
  aries: "Aries",
  taurus: "Tauro",
  gemini: "Géminis",
  cancer: "Cáncer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Escorpio",
  sagittarius: "Sagitario",
  capricorn: "Capricornio",
  aquarius: "Acuario",
  pisces: "Piscis",
} as const;

function buildPrompt(chart: NatalChartData, pointId: ChartPointId, locale?: string): string {
  const point = chart.points.find((entry) => entry.id === pointId);

  if (!point) {
    return "";
  }

  const sign = zodiacSigns.find((entry) => entry.id === point.sign);
  const signName = SIGN_LABELS[point.sign];
  const element = sign?.element ?? "";
  const modality = sign?.modality ?? "";

  const pointName: Record<ChartPointId, string> = {
    sun: "Sol",
    moon: "Luna",
    mercury: "Mercurio",
    venus: "Venus",
    mars: "Marte",
    jupiter: "Júpiter",
    saturn: "Saturno",
    uranus: "Urano",
    neptune: "Neptuno",
    pluto: "Plutón",
    northNode: "Nodo Norte",
    southNode: "Nodo Sur",
    chiron: "Quirón",
    partOfFortune: "Parte de la Fortuna",
    lilith: "Lilith",
    ceres: "Ceres",
  };

  const houseNames: Record<number, string> = {
    1: "Casa 1 (identidad, cuerpo y forma de presentarte)",
    2: "Casa 2 (dinero, valor propio y seguridad)",
    3: "Casa 3 (mente, palabra, estudios y entorno cercano)",
    4: "Casa 4 (familia, hogar y raíz emocional)",
    5: "Casa 5 (deseo, creatividad, placer e hijos)",
    6: "Casa 6 (rutina, trabajo diario, salud y hábitos)",
    7: "Casa 7 (pareja, socios y acuerdos)",
    8: "Casa 8 (intimidad, dinero compartido, crisis y control)",
    9: "Casa 9 (creencias, viajes, estudios y dirección)",
    10: "Casa 10 (trabajo, vocación, imagen pública y autoridad)",
    11: "Casa 11 (amistades, grupos, redes y proyectos futuros)",
    12: "Casa 12 (descanso, inconsciente, cierre y lo que escondes)",
  };

  const allPoints = chart.points
    .map((entry) => {
      const signLabel = SIGN_LABELS[entry.sign];
      return `• ${pointName[entry.id]} en ${signLabel} ${entry.degreeInSign}°, casa ${entry.house}${entry.retrograde ? " (Rx)" : ""}`;
    })
    .join("\n");

  const pointAspects = chart.aspects
    .filter((aspect) => aspect.from === pointId || aspect.to === pointId)
    .map((aspect) => {
      const otherId = aspect.from === pointId ? aspect.to : aspect.from;
      const other = chart.points.find((entry) => entry.id === otherId);
      const otherSign = other ? SIGN_LABELS[other.sign] : "";
      const aspectName = {
        conjunction: "Conjunción",
        sextile: "Sextil",
        square: "Cuadratura",
        trine: "Trígono",
        opposition: "Oposición",
        quincunx: "Quincuncio",
      }[aspect.type];

      return `  - ${aspectName} con ${pointName[otherId]} en ${otherSign} (orbe ${aspect.orb}°)`;
    })
    .join("\n");

  return `Eres SARITA, astróloga amiga de ${chart.event.name}. Escribes
de forma directa, sin rodeos y sin poesía. Tu objetivo es que
${chart.event.name} lea esto y piense "claro, eso soy yo."

Estás leyendo el ${pointName[pointId]} de ${chart.event.name}:
${signName} ${point.degreeInSign}°, ${houseNames[point.house]}.
${point.retrograde ? "Está retrógrado." : ""}

Aspectos activos:
${pointAspects || "Sin aspectos principales"}

Carta natal completa:
${allPoints}

Escribe 4 párrafos. El primero describe cómo se nota este
planeta en el carácter o los patrones cotidianos de esta persona.
Los siguientes profundizan — salen zonas de tensión, dónde
funciona bien y dónde se complica. El último cierra con algo
concreto y útil que ${chart.event.name} puede hacer con esto.

Modelo de tono:
  "Tu Saturno en Capricornio en Casa 6 significa que eres de
  las personas que si no tienen una rutina, se desmoronan un
  poco. No porque seas rígida — sino porque tu sistema nervioso
  necesita estructura para relajarse. Cuando eso falla, aparece
  la autocrítica antes que el descanso."

Reglas:
- Segunda persona, "tú", España.
- Sin metáforas poéticas. Sin "energía", "vibración", "alma".
- Menciona situaciones reconocibles: trabajo, relaciones,
  cuerpo, hábitos, reacciones emocionales.
- La respuesta empieza directamente con el contenido. El primer carácter es siempre mayúscula.
- 300-400 palabras. Sin subtítulos ni markdown.

Datos técnicos internos si ayudan: ${element} / ${modality}.

${langInstruction(locale)}`;
}

export async function POST(request: Request) {
  try {
    const { chart, pointId, locale } = (await request.json()) as {
      chart: NatalChartData;
      pointId: ChartPointId;
      locale?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const prompt = buildPrompt(chart, pointId, locale);

    if (!prompt) {
      return new Response("Unknown point", { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
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
    console.error("Reading API error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
