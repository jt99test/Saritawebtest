type JsonLike = string | number | boolean | null | JsonLike[] | { [key: string]: JsonLike };

const SPANISH_LEAK_PATTERN =
  /\b(que|como|cuando|donde|desde|hacia|porque|trabajo|relaciones|sientes|tienes|puede|puedes|quieres|hacer|esto|algo|vida|cuerpo|vinculo|vinculos|lectura|parrafo|parrafos|subtitulos)\b/i;

export function hasSpanishLeak(value: unknown, locale?: string): boolean {
  if (locale !== "it") {
    return false;
  }

  if (typeof value === "string") {
    return SPANISH_LEAK_PATTERN.test(value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasSpanishLeak(entry, locale));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => hasSpanishLeak(entry, locale));
  }

  return false;
}

export function assertGeneratedLanguage(value: unknown, locale?: string) {
  if (hasSpanishLeak(value, locale)) {
    throw new Error("Generated content contains Spanish text in Italian mode");
  }
}

export function sanitizeGeneratedLanguage<T extends JsonLike>(value: T): T {
  return value;
}
