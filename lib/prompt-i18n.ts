export type PromptLocale = "es" | "en" | "it";

export function normalizePromptLocale(locale?: string): PromptLocale {
  return locale === "en" || locale === "it" ? locale : "es";
}

export function promptLanguageInstruction(locale?: string) {
  const nextLocale = normalizePromptLocale(locale);

  if (nextLocale === "en") {
    return "Write entirely in natural English. Do not output Spanish or Italian words unless they are proper names or stable JSON keys.";
  }

  if (nextLocale === "it") {
    return "Scrivi interamente in italiano naturale. Non usare parole spagnole o inglesi, salvo nomi propri o chiavi JSON stabili. Usa il tu informale, mai Lei/voi o formule di cortesia. IMPORTANTE: Scrivi ESCLUSIVAMENTE in italiano. Non usare parole spagnole come \"que\", \"como\", \"cuando\", \"trabajo\", \"relaciones\", \"vida\" o simili. Solo italiano.";
  }

  return "Escribe en espanol de Espana, con trato de tu. No uses ingles ni italiano salvo nombres propios o claves JSON estables.";
}

export function nativeToneInstruction(locale?: string) {
  const nextLocale = normalizePromptLocale(locale);

  if (nextLocale === "en") {
    return "Sound authored in English, not translated from Spanish: direct, warm, practical, and conversational.";
  }

  if (nextLocale === "it") {
    return "Suona scritto direttamente in italiano, non tradotto dallo spagnolo: caldo, diretto, pratico e colloquiale.";
  }

  return "Suena escrito originalmente en espanol: cercano, directo, practico y conversacional.";
}

export function jsonOnlyInstruction(locale?: string) {
  const nextLocale = normalizePromptLocale(locale);

  if (nextLocale === "en") {
    return "Return ONLY valid JSON. No markdown, no code fence, no text before or after it.";
  }

  if (nextLocale === "it") {
    return "Restituisci SOLO JSON valido. Niente markdown, niente blocchi di codice, niente testo prima o dopo.";
  }

  return "Devuelve SOLO JSON valido. Sin markdown, sin bloque de codigo, sin texto antes ni despues.";
}

export function transitMotionLabel(applying: boolean, locale?: string) {
  const nextLocale = normalizePromptLocale(locale);

  if (nextLocale === "en") {
    return applying ? "applying" : "separating";
  }

  if (nextLocale === "it") {
    return applying ? "applicativo" : "separativo";
  }

  return applying ? "aplicativo" : "separativo";
}

export function housePhrase(house: number, locale?: string) {
  const nextLocale = normalizePromptLocale(locale);

  if (nextLocale === "en") {
    return `house ${house}`;
  }

  if (nextLocale === "it") {
    return `casa ${house}`;
  }

  return `casa ${house}`;
}

export function placementPhrase({
  point,
  sign,
  degree,
  minutes,
  house,
  retrograde,
  locale,
}: {
  point: string;
  sign: string;
  degree: number;
  minutes?: number;
  house: number;
  retrograde?: boolean;
  locale?: string;
}) {
  const nextLocale = normalizePromptLocale(locale);
  const minuteText = typeof minutes === "number" ? `${String(minutes).padStart(2, "0")}'` : "";
  const position = `${degree}°${minuteText}`;
  const rx = retrograde ? " (Rx)" : "";

  if (nextLocale === "en") {
    return `${point} in ${sign} ${position}, house ${house}${rx}`;
  }

  if (nextLocale === "it") {
    return `${point} in ${sign} ${position}, casa ${house}${rx}`;
  }

  return `${point} en ${sign} ${position}, casa ${house}${rx}`;
}

export function aspectPhrase({
  from,
  aspect,
  to,
  orb,
  applying,
  locale,
}: {
  from: string;
  aspect: string;
  to: string;
  orb?: number | string;
  applying?: boolean;
  locale?: string;
}) {
  const nextLocale = normalizePromptLocale(locale);
  const orbText = typeof orb !== "undefined" ? `${nextLocale === "en" ? "orb" : nextLocale === "it" ? "orbe" : "orbe"} ${orb}°` : "";
  const motionText = typeof applying === "boolean" ? `, ${transitMotionLabel(applying, locale)}` : "";

  if (nextLocale === "en") {
    return `${from} ${aspect} ${to}${orbText ? ` (${orbText}${motionText})` : ""}`;
  }

  if (nextLocale === "it") {
    return `${from} ${aspect} ${to}${orbText ? ` (${orbText}${motionText})` : ""}`;
  }

  return `${from} ${aspect} ${to}${orbText ? ` (${orbText}${motionText})` : ""}`;
}

export function noMajorAspects(locale?: string) {
  const nextLocale = normalizePromptLocale(locale);
  if (nextLocale === "en") return "No major aspects";
  if (nextLocale === "it") return "Nessun aspetto principale";
  return "Sin aspectos principales";
}

export function noRelevantTransits(locale?: string) {
  const nextLocale = normalizePromptLocale(locale);
  if (nextLocale === "en") return "None especially relevant under this method's filters.";
  if (nextLocale === "it") return "Nessuno particolarmente rilevante secondo i filtri del metodo.";
  return "Ninguno especialmente relevante segun los filtros del metodo.";
}
