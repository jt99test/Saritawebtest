export function normalizeReadingText(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitReading(text: string): { headline: string; body: string } {
  const trimmed = normalizeReadingText(text);
  const match = trimmed.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (match) {
    return { headline: match[1].trim(), body: match[2].trim() };
  }
  return { headline: trimmed, body: "" };
}
