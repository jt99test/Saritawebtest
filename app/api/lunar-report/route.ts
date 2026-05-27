import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { isAdminEmail } from "@/lib/admin";
import { DateTime } from "luxon";

import { getSignFromLongitude, getSignMeta, type NatalChartData } from "@/lib/chart";
import type {
  LunarReportActionSet,
  LunationType,
} from "@/lib/lunar-report";
import { getMonthlyLunarData } from "@/lib/lunar.server";
import { getActiveTransits, getTransitingPositions } from "@/lib/transits.server";
import { getHouseMessages } from "@/data/sarita/house-messages";
import { elementRoutines } from "@/data/sarita/element-routines";
import { getTransitDescriptions } from "@/data/sarita/transit-descriptions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ANTHROPIC_FAST_MODEL, ANTHROPIC_STANDARD_READING_MODEL } from "@/lib/anthropic-models";
import {
  aiGenerationStatusResponse,
  getAiGenerationStatus,
  getCachedAiReading,
  markAiReadingGenerationFailed,
  reserveAiReadingGeneration,
  setCachedAiReading,
  validateReadingGenerationAccess,
} from "@/lib/ai-reading-generations";
import { assertGeneratedLanguage } from "@/lib/generated-language";
import { getAspectLabel, getPointLabel, getSignLabel } from "@/lib/chart-labels";
import { noRelevantTransits, promptLanguageInstruction } from "@/lib/prompt-i18n";
import { genderPromptInstruction, grammarPromptInstruction, normalizeReadingGender, type ReadingGender } from "@/lib/reading-gender";

type LunarReportRequest = {
  chart: NatalChartData;
  year: number;
  month: number;
  lunationType: LunationType;
  metadataOnly?: boolean;
  locale?: string;
  readingId?: string;
  cacheKey?: string;
  gender?: ReadingGender;
};

type CachedLunarContent = {
  prose: string;
  actions: LunarReportActionSet | null;
};

const ACTIONS_MARKER = "__SARITA_ACTIONS__";

type LifecycleEvent =
  | "jupiter-return"
  | "jupiter-opposition"
  | "saturn-return"
  | "saturn-opposition"
  | "uranus-return"
  | "uranus-opposition";

function lifecycleTransitLabel(lifecycleEvent?: LifecycleEvent, locale?: string) {
  if (!lifecycleEvent) return "";
  const labels: Record<LifecycleEvent, Record<"es" | "en" | "it", string>> = {
    "jupiter-return": { es: "Retorno de Júpiter", en: "Jupiter return", it: "Ritorno di Giove" },
    "jupiter-opposition": { es: "Oposición de Júpiter", en: "Jupiter opposition", it: "Opposizione di Giove" },
    "saturn-return": { es: "Retorno de Saturno", en: "Saturn return", it: "Ritorno di Saturno" },
    "saturn-opposition": { es: "Oposición de Saturno", en: "Saturn opposition", it: "Opposizione di Saturno" },
    "uranus-return": { es: "Retorno de Urano", en: "Uranus return", it: "Ritorno di Urano" },
    "uranus-opposition": { es: "Oposición de Urano", en: "Uranus opposition", it: "Opposizione di Urano" },
  };
  const language = locale === "en" || locale === "it" ? locale : "es";
  return labels[lifecycleEvent][language];
}

function langInstruction(locale?: string): string {
  if (locale === "en") return "Write entirely in English. Do not output Spanish words unless they are proper names.";
  if (locale === "it") return "Write entirely in Italian. Do not output Spanish words unless they are proper names.";
  return promptLanguageInstruction(locale);
}

function monthLabel(year: number, month: number, locale?: string) {
  return DateTime.utc(year, month, 1).setLocale(locale ?? "es").toFormat("LLLL yyyy");
}

function localeKey(locale?: string): "es" | "en" | "it" {
  return locale === "en" || locale === "it" ? locale : "es";
}

function lunarLabel(lunationType: LunationType, locale?: string) {
  const isNewMoon = lunationType.startsWith("nueva");
  const labels = {
    es: isNewMoon ? "Nueva" : "Llena",
    en: isNewMoon ? "New Moon" : "Full Moon",
    it: isNewMoon ? "Nuova" : "Piena",
  };
  return labels[localeKey(locale)];
}

function chartSummaryLabels(locale?: string) {
  const labels = {
    es: { ascendant: "Ascendente", aspects: "Aspectos principales:", noAspects: "- Sin aspectos registrados", orb: "orbe", applying: "aplicativo", separating: "separativo", connector: "en", house: "casa" },
    en: { ascendant: "Ascendant", aspects: "Major aspects:", noAspects: "- No aspects recorded", orb: "orb", applying: "applying", separating: "separating", connector: "in", house: "house" },
    it: { ascendant: "Ascendente", aspects: "Aspetti principali:", noAspects: "- Nessun aspetto registrato", orb: "orbe", applying: "applicativo", separating: "separativo", connector: "in", house: "casa" },
  };
  return labels[localeKey(locale)];
}

function buildChartSummary(chart: NatalChartData, locale?: string) {
  const labels = chartSummaryLabels(locale);
  const pointLines = chart.points.map((point) => {
    const signName = getSignLabel(point.sign, locale);
    return `- ${getPointLabel(point.id, locale)} ${labels.connector} ${signName} ${point.degreeInSign}°${String(point.minutesInSign).padStart(2, "0")}', ${labels.house} ${point.house}${point.retrograde ? " (Rx)" : ""}`;
  });

  const aspectLines = chart.aspects.map((aspect) => {
    return `- ${getPointLabel(aspect.from, locale)} ${getAspectLabel(aspect.type, locale)} ${getPointLabel(aspect.to, locale)} (${labels.orb} ${aspect.orb}°, ${aspect.applying ? labels.applying : labels.separating})`;
  });

  return [
    `${labels.ascendant}: ${chart.meta.ascendant.toFixed(2)}°`,
    ...pointLines,
    labels.aspects,
    ...(aspectLines.length > 0 ? aspectLines : [labels.noAspects]),
  ].join("\n");
}

async function buildTransitList(chart: NatalChartData, lunationTimestamp: string, locale?: string) {
  const transits = (await getActiveTransits(chart, new Date(lunationTimestamp))).slice(0, 5);
  const transitingPositions = await getTransitingPositions(new Date(lunationTimestamp));
  const transitingElements = new Map(
    transitingPositions.map((point) => [point.id, getSignMeta(getSignFromLongitude(point.longitude)).element] as const),
  );
  const descriptions = getTransitDescriptions(locale);

  if (transits.length === 0) {
    return {
      lines: noRelevantTransits(locale),
      structured: [],
    };
  }

  const structured = transits.map((transit) => {
    const transitingPlanetLabel = getPointLabel(transit.transitingPlanet, locale);
    const natalPoint = chart.points.find((point) => point.id === transit.natalPlanet);
    const description = descriptions[transitingPlanetLabel] ?? getTransitDescriptions("es")[getPointLabel(transit.transitingPlanet, "es")];
    return {
      ...transit,
      transitingPlanetLabel,
      natalPlanetLabel: getPointLabel(transit.natalPlanet, locale),
      aspectLabel: getAspectLabel(transit.aspectType, locale),
      transitingElement: transitingElements.get(transit.transitingPlanet),
      natalElement: natalPoint ? getSignMeta(natalPoint.sign).element : undefined,
      description: description?.description ?? "",
      relevance: description?.relevance ?? "",
    };
  });

  return {
    lines: structured
      .map((transit) => {
        const lifecycleLabel = lifecycleTransitLabel(transit.lifecycleEvent, locale);
        if (locale === "en") {
          return `- ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel} (orb ${transit.orb}°). Relevance: ${transit.relevance}.`;
        }
        if (locale === "it") {
          return `- ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel} (orbe ${transit.orb}°). Rilevanza: ${transit.relevance}.`;
        }
        return `- ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel} (orbe ${transit.orb}°). Relevancia: ${transit.relevance}.`;
      })
      .join("\n"),
    structured,
  };
}

type LunarTransitSummaryInput = Awaited<ReturnType<typeof buildTransitList>>["structured"];

function extractTextContent(message: Message) {
  return message.content
    .map((block) => block.type === "text" ? block.text : "")
    .join("")
    .trim();
}

async function enrichTransitSummaries({
  client,
  chart,
  transits,
  locale,
  gender,
}: {
  client: Anthropic;
  chart: NatalChartData;
  transits: LunarTransitSummaryInput;
  locale?: string;
  gender?: ReadingGender;
}) {
  const visibleTransits = transits.slice(0, 3);

  if (visibleTransits.length === 0) {
    return transits;
  }

  if (locale === "en" || locale === "it") {
    const promptIntro =
      locale === "en"
        ? `Briefly explain what ${chart.event.name}'s active transits mean this month.`
        : `Spiega brevemente che cosa significano per ${chart.event.name} i transiti attivi di questo mese.`;
    const promptRules =
      locale === "en"
        ? `Each text:
- 1-2 short sentences. Maximum 34 words total.
- Explain what the transit activates in the person's concrete life and close with one practical cue.
- You may name the planet or aspect if useful, but avoid heavy jargon.
- Tone: a direct astrologer friend, clear and useful.`
        : `Ogni testo:
- 1-2 frasi brevi. Massimo 34 parole totali.
- Spiega che cosa attiva il transito nella vita concreta della persona e chiudi con una pista pratica.
- Puoi nominare il pianeta o l'aspetto se aiuta, ma senza gergo pesante.
- Tono: amica diretta che conosce l'astrologia, chiaro e utile.`;
    const transitsLabel = locale === "en" ? "Transits:" : "Transiti:";
    const topicLabel = locale === "en" ? "Theme" : "Tema";
    const jsonInstruction = locale === "en" ? "Return only valid JSON on one line:" : "Restituisci solo JSON valido in una riga:";
    const prompt = `${promptIntro}

${promptRules}

${transitsLabel}
${visibleTransits.map((transit, index) => {
  const lifecycleLabel = lifecycleTransitLabel(transit.lifecycleEvent, locale);
  return `${index + 1}. ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel}. ${topicLabel}: ${transit.relevance || transit.description}`;
}).join("\n")}

${jsonInstruction}
{"summaries":["...", "...", "..."]}

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

${langInstruction(locale)}`;

    try {
      const message = await client.messages.create({
        model: ANTHROPIC_FAST_MODEL,
        max_tokens: 220,
        messages: [{ role: "user", content: prompt }],
      });
      const parsed = JSON.parse(extractTextContent(message)) as { summaries?: unknown };
      const summaries = Array.isArray(parsed.summaries) ? parsed.summaries : [];

      return transits.map((transit, index) => {
        const summary = summaries[index];

        if (typeof summary !== "string" || !summary.trim()) {
          return transit;
        }

        return {
          ...transit,
          practicalSummary: summary.trim(),
        };
      });
    } catch (error) {
      console.error("Could not generate lunar transit summaries:", error);
      return transits;
    }
  }

  const prompt = `Explica de forma breve qué significan para ${chart.event.name} sus tránsitos activos este mes.

Cada texto:
- 1-2 frases cortas. Total máximo 34 palabras.
- Explica qué activa ese tránsito en la vida concreta de la persona y cierra con una pista práctica.
- Puede nombrar el planeta o el aspecto si ayuda, pero sin jerga pesada.
- Tono: amiga directa que sabe astrología, claro y útil.

Tránsitos:
${visibleTransits.map((transit, index) => {
  const lifecycleLabel = lifecycleTransitLabel(transit.lifecycleEvent, locale);
  return `${index + 1}. ${lifecycleLabel ? `${lifecycleLabel}: ` : ""}${transit.transitingPlanetLabel} ${transit.aspectLabel} ${transit.natalPlanetLabel}. Tema: ${transit.relevance || transit.description}`;
}).join("\n")}

Devuelve solo JSON válido en una línea:
{"summaries":["...", "...", "..."]}

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

${langInstruction(locale)}`;

  try {
    const message = await client.messages.create({
      model: ANTHROPIC_FAST_MODEL,
      max_tokens: 220,
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse(extractTextContent(message)) as { summaries?: unknown };
    const summaries = Array.isArray(parsed.summaries) ? parsed.summaries : [];

    return transits.map((transit, index) => {
      const summary = summaries[index];

      if (typeof summary !== "string" || !summary.trim()) {
        return transit;
      }

      return {
        ...transit,
        practicalSummary: summary.trim(),
      };
    });
  } catch (error) {
    console.error("Could not generate lunar transit summaries:", error);
    return transits;
  }
}

function buildPrompt({
  chart,
  year,
  month,
  lunationType,
  metadata,
  transitLines,
  locale,
  gender,
}: {
  chart: NatalChartData;
  year: number;
  month: number;
  lunationType: LunationType;
  metadata: {
    signLabel: string;
    degree: number;
    minutes: number;
    house: number;
    areaOfLife: string;
    baseMessage: string;
    eclipse?: { isEclipse: boolean; kind: "solar" | "lunar"; nodeOrb: number };
  };
  transitLines: string;
  locale?: string;
  gender?: ReadingGender;
}) {
  const name = chart.event.name;
  const lunaLabel = lunarLabel(lunationType, locale);

  if (locale === "en") {
    return `You are ${name}'s astrologer friend, explaining what this month brings through the ${lunaLabel} in their chart.

Your tone: close, direct, useful. Like a friend who knows the chart well, not like a distant astrologer. Use concrete examples of how this appears in daily life. No literary metaphors.

CONTEXT:
${name} has the ${lunaLabel} of ${monthLabel(year, month, locale)} in ${metadata.signLabel} ${metadata.degree}°${String(metadata.minutes).padStart(2, "0")}', activating house ${metadata.house} (${metadata.areaOfLife}).
${metadata.eclipse?.isEclipse ? `This lunation is a ${metadata.eclipse.kind === "solar" ? "solar" : "lunar"} eclipse: it occurs ${metadata.eclipse.nodeOrb} degrees from the nodal axis. Treat it as a more intense activation, with echoes over 6 to 18 months, not like an ordinary monthly moon.` : ""}

Sarita Shakti's base message for this house is:
"${metadata.baseMessage}"

Relevant active transits this month:
${transitLines}

Full astrological context:
${buildChartSummary(chart, locale)}

YOUR TASK:
Write ONE paragraph of 80-100 words. Start with which Moon it is and which house it activates. Say how it may show up this month in ${name}'s life with one real example. Briefly mention the most relevant transit if there is one. End with something concrete to do or avoid. No headings. No multiple paragraphs.

Do not rewrite Sarita's message: use it as a base and express it in a friendly tone. Sarita is the astrological authority; you translate it into a close conversation.

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

${langInstruction(locale)}`;
  }

  if (locale === "it") {
    return `Sei l'astrologa amica di ${name} e stai spiegando che cosa porta questo mese attraverso la Luna ${lunaLabel} nella sua carta.

Tono: vicino, diretto, utile. Come un'amica che conosce bene la carta, non come un'astrologa distante. Usa esempi concreti di come questo appare nella vita quotidiana. Niente metafore letterarie.

CONTESTO:
${name} ha la Luna ${lunaLabel} di ${monthLabel(year, month, locale)} in ${metadata.signLabel} ${metadata.degree}°${String(metadata.minutes).padStart(2, "0")}', che attiva la casa ${metadata.house} (${metadata.areaOfLife}).
${metadata.eclipse?.isEclipse ? `Questa lunazione e un'eclissi ${metadata.eclipse.kind === "solar" ? "solare" : "lunare"}: avviene a ${metadata.eclipse.nodeOrb} gradi dall'asse nodale. Trattala come un'attivazione piu intensa, con echi da 6 a 18 mesi, non come una luna mensile ordinaria.` : ""}

Il messaggio base che Sarita Shakti da per questa casa e:
"${metadata.baseMessage}"

Transiti attivi rilevanti questo mese:
${transitLines}

Contesto astrologico completo della persona:
${buildChartSummary(chart, locale)}

COMPITO:
Scrivi UN paragrafo di 80-100 parole. Inizia dicendo che Luna e e quale casa attiva. Spiega come si fara notare questo mese nella vita di ${name} con un esempio reale. Cita brevemente il transito piu rilevante, se c'e. Chiudi con qualcosa di concreto da fare o evitare. Niente titoli. Niente paragrafi multipli.

Non riscrivere il messaggio di Sarita: usalo come base ed esprimilo in tono amico. L'autorita astrologica e Sarita; tu la traduci in una conversazione vicina.

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

${langInstruction(locale)}`;
  }

  return `Eres una astróloga amiga de ${name} que le está explicando qué le toca este mes según la Luna ${lunaLabel} en su carta.

Tu tono: cercano, directo, útil. Como una amiga que se la sabe, no como una astróloga distante. Ejemplos concretos de cómo esto aparece en su día a día. Sin metáforas literarias.

CONTEXTO:
${name} tiene su Luna ${lunaLabel} de ${monthLabel(year, month, locale)} en ${metadata.signLabel} ${metadata.degree}°${String(metadata.minutes).padStart(2, "0")}', activando su Casa ${metadata.house} (${metadata.areaOfLife}).
${metadata.eclipse?.isEclipse ? `Esta lunacion es un eclipse ${metadata.eclipse.kind === "solar" ? "solar" : "lunar"}: ocurre a ${metadata.eclipse.nodeOrb} grados del eje nodal. Tratalo como una activacion mas intensa, con ecos de 6 a 18 meses, no como una luna mensual ordinaria.` : ""}

El mensaje base que da la astróloga Sarita Shakti para esta casa es:
"${metadata.baseMessage}"

Tránsitos activos relevantes este mes:
${transitLines}

Contexto astrológico completo de la persona:
${buildChartSummary(chart, locale)}

TU TAREA:
Escribe UN párrafo de 80-100 palabras. Empieza con qué Luna es y qué casa
activa. Di cómo se va a notar ese mes en la vida de ${name} con un ejemplo
real. Menciona brevemente el tránsito más relevante si lo hay. Termina con
algo concreto que hacer o evitar. Sin subtítulos. Sin párrafos múltiples.

No reescribas el mensaje de Sarita: úsalo como base y exprésalo en el tono amigo. La autoridad astrológica es de Sarita; tú la traduces a una conversación cercana.

${genderPromptInstruction(gender, locale)}
${grammarPromptInstruction(locale)}

${langInstruction(locale)}`;
}

function buildActionsPrompt(locale?: string) {
  if (locale === "en") {
    return `After the main reading, add one final separate line with exactly this marker followed by valid JSON on one line:
${ACTIONS_MARKER}{"hazEsto":"...","evitaEsto":"...","preguntate":"..."}

Rules for that final line:
- Do not add text before or after the JSON.
- Each key must contain 1 or 2 concrete, actionable sentences.
- "hazEsto" must be a specific action with a verb and object. Never "work on your inner world"; use "Write a list of what you want to close before the end of the month."
- "evitaEsto" must be a specific behavior. Never "avoid excess"; use "Do not start new projects if you already have three half-finished."
- "preguntate" must be a question the person can sit down and answer. Never "What does your soul want?"; use "What have you been saying you will do for more than six months, but have not done?"
- ${langInstruction(locale)}
- The main reading must come first, and the ${ACTIONS_MARKER} line at the end.`;
  }

  if (locale === "it") {
    return `Dopo la lettura principale, aggiungi una riga finale separata con esattamente questo marker seguito da JSON valido in una sola riga:
${ACTIONS_MARKER}{"hazEsto":"...","evitaEsto":"...","preguntate":"..."}

Regole per quella riga finale:
- Non aggiungere testo prima o dopo il JSON.
- Ogni chiave deve avere 1 o 2 frasi concrete e azionabili.
- "hazEsto" deve essere un'azione specifica con verbo e oggetto. Mai "lavora sul tuo mondo interiore"; usa "Scrivi una lista di cio che vuoi chiudere prima della fine del mese."
- "evitaEsto" deve essere un comportamento specifico. Mai "evita l'eccesso"; usa "Non iniziare progetti nuovi se ne hai gia tre a meta."
- "preguntate" deve essere una domanda a cui la persona possa sedersi a rispondere. Mai "Che cosa vuole la tua anima?"; usa "Che cosa dici da piu di sei mesi che farai, ma non hai ancora fatto?"
- ${langInstruction(locale)}
- La lettura principale deve venire prima, e la riga ${ACTIONS_MARKER} alla fine.`;
  }

  return null;
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

    if (!isAdminEmail(user.email) && (profile?.plan ?? "free") === "free") {
      return new Response("Plan required", { status: 403 });
    }

    const { chart, year, month, lunationType, metadataOnly = false, locale, readingId, cacheKey, gender } =
      (await request.json()) as LunarReportRequest;
    const readingGender = normalizeReadingGender(gender);

    const monthlyData = await getMonthlyLunarData(chart, year, month);
    const lunation =
      lunationType === "nueva"
        ? monthlyData.lunaNueva
        : lunationType === "nueva-2"
          ? monthlyData.lunaNuevaSecondary
          : lunationType === "llena-2"
            ? monthlyData.lunaLlenaSecondary
            : monthlyData.lunaLlena;

    if (!lunation) {
      return new Response("No lunation found for the requested month", { status: 404 });
    }

    const houseMessage = getHouseMessages(locale)[lunation.activatedHouse - 1];
    if (!houseMessage) {
      return new Response("House message not found", { status: 500 });
    }

    const routine = elementRoutines[lunation.assignedRoutine];
    const transitData = await buildTransitList(chart, lunation.timestamp, locale);
    const client = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
    const isNewMoon = lunationType.startsWith("nueva");
    const baseMessage =
      isNewMoon
        ? houseMessage.lunaNueva.baseMessage
        : houseMessage.lunaLlena.baseMessage;

    const metadata = {
      lunationType,
      year,
      month,
      timestamp: lunation.timestamp,
      position: lunation.position,
      activatedHouse: lunation.activatedHouse,
      areaOfLife: houseMessage.areaOfLife,
      subtitle:
        isNewMoon
          ? houseMessage.lunaNueva.subtitle
          : houseMessage.lunaLlena.subtitle,
      baseMessage,
      element: lunation.element,
      assignedRoutine: lunation.assignedRoutine,
      eclipse: lunation.eclipse,
      routine: {
        element: routine.element,
        bodyZone: routine.bodyZone,
        chakra: routine.chakra,
        intention: routine.intention,
        totalDuration: routine.totalDuration,
      },
      activeTransits: transitData.structured,
    };

    if (metadataOnly) {
      return Response.json(metadata);
    }

    const itemKey = `v2:${cacheKey ?? `lunar:${locale ?? "es"}:${year}-${month}-${lunationType}`}:${readingGender || "unspecified"}`;
    const access = await validateReadingGenerationAccess({ supabase, user, readingId });
    if (!access.ok) {
      return access.response;
    }

    const cachedContent = await getCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "lunar",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });

    const cachedStatus = getAiGenerationStatus(cachedContent);
    if (cachedStatus === "generating") {
      return aiGenerationStatusResponse(cachedStatus);
    }

    if (
      cachedContent &&
      typeof cachedContent === "object" &&
      typeof (cachedContent as CachedLunarContent).prose === "string"
    ) {
      const cached = cachedContent as CachedLunarContent;
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "metadata", data: metadata })}\n`));
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "text", data: cached.prose })}\n`));
          if (cached.actions) {
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "actions", data: cached.actions })}\n`));
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done" })}\n`));
          controller.close();
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

    if (!client) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const reservation = await reserveAiReadingGeneration({
      supabase,
      user,
      readingId,
      scope: "lunar",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
    });

    if (!reservation.ok) {
      return reservation.response;
    }

    if (
      !reservation.reserved &&
      reservation.content &&
      typeof reservation.content === "object" &&
      typeof (reservation.content as CachedLunarContent).prose === "string"
    ) {
      const cached = reservation.content as CachedLunarContent;
      return new Response([
        `${JSON.stringify({ type: "metadata", data: metadata })}`,
        `${JSON.stringify({ type: "text", data: cached.prose })}`,
        cached.actions ? `${JSON.stringify({ type: "actions", data: cached.actions })}` : "",
        `${JSON.stringify({ type: "done" })}`,
      ].filter(Boolean).join("\n"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const activeTransits = await enrichTransitSummaries({
      client,
      chart,
      transits: transitData.structured,
      locale,
      gender: readingGender,
    });
    const generationMetadata = {
      ...metadata,
      activeTransits,
    };

    const prompt = buildPrompt({
      chart,
      year,
      month,
      lunationType,
      metadata: {
        signLabel: getSignLabel(lunation.position.sign, locale),
        degree: lunation.position.degree,
        minutes: lunation.position.minutes,
        house: lunation.activatedHouse,
        areaOfLife: houseMessage.areaOfLife,
        baseMessage,
        eclipse: lunation.eclipse,
      },
      transitLines: transitData.lines,
      locale,
      gender: readingGender,
    });

    let streamingPrompt = `${prompt}

Después de la lectura principal, añade en una línea final separada exactamente este marcador seguido de un JSON válido en una sola línea:
${ACTIONS_MARKER}{"hazEsto":"...","evitaEsto":"...","preguntate":"..."}

Reglas para esa línea final:
- No añadas texto antes ni después del JSON.
- Cada clave debe tener 1 o 2 frases concretas y accionables.
- "hazEsto" debe ser una acción específica con verbo y objeto. Nunca "trabaja tu interior"; sí "Escribe una lista de lo que quieres cerrar antes de fin de mes."
- "evitaEsto" debe ser una conducta específica. Nunca "evita el exceso"; sí "No empieces proyectos nuevos si tienes tres a medias."
- "preguntate" debe ser una pregunta que la persona pueda sentarse a responder. Nunca "¿Qué quiere tu alma?"; sí "¿Qué llevas más de seis meses diciendo que vas a hacer y no has hecho?"
- ${langInstruction(locale)}
- La lectura principal debe ir primero, y la línea ${ACTIONS_MARKER} al final.`;

    const localizedActionsPrompt = buildActionsPrompt(locale);
    if (localizedActionsPrompt) {
      streamingPrompt = `${prompt}

${localizedActionsPrompt}`;
    }

    let rawContent = "";

    try {
      const message = await client.messages.create({
        model: ANTHROPIC_STANDARD_READING_MODEL,
        max_tokens: 600,
        messages: [{ role: "user", content: streamingPrompt }],
      });
      rawContent = extractTextContent(message);
    } catch (error) {
      console.error("Lunar report generation failed:", error);
      await markAiReadingGenerationFailed({
        supabase,
        user,
        readingId,
        scope: "lunar",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
      });
      return new Response("Lunar report generation failed", { status: 502 });
    }

    const markerIndex = rawContent.indexOf(ACTIONS_MARKER);
    const prose = (markerIndex >= 0 ? rawContent.slice(0, markerIndex) : rawContent).trim();
    let finalActions: LunarReportActionSet | null = null;

    if (markerIndex >= 0) {
      try {
        finalActions = JSON.parse(rawContent.slice(markerIndex + ACTIONS_MARKER.length).trim()) as LunarReportActionSet;
      } catch (error) {
        console.error("Could not parse lunar actions:", error);
      }
    }

    if (!prose) {
      await markAiReadingGenerationFailed({
        supabase,
        user,
        readingId,
        scope: "lunar",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
      });
      return new Response("Empty model response", { status: 502 });
    }

    try {
      assertGeneratedLanguage({ prose, actions: finalActions }, locale);
    } catch (error) {
      console.error("Lunar report language validation failed:", error);
      await markAiReadingGenerationFailed({
        supabase,
        user,
        readingId,
        scope: "lunar",
        itemKey,
        locale,
        cacheUserId: access.cacheUserId,
      });
      return new Response("Lunar report language validation failed", { status: 502 });
    }

    await setCachedAiReading({
      supabase,
      user,
      readingId,
      scope: "lunar",
      itemKey,
      locale,
      cacheUserId: access.cacheUserId,
      content: {
        prose,
        actions: finalActions,
      },
    });

    return new Response([
      `${JSON.stringify({ type: "metadata", data: generationMetadata })}`,
      `${JSON.stringify({ type: "text", data: prose })}`,
      finalActions ? `${JSON.stringify({ type: "actions", data: finalActions })}` : "",
      `${JSON.stringify({ type: "done" })}`,
    ].filter(Boolean).join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Lunar report API error:", error);
    return new Response("Internal error", { status: 500 });
  }
}


