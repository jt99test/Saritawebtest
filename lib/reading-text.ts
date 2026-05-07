export function normalizeReadingText(text: string): string {
  const cleaned = text
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .replace(/^SARITA\s+/i, "")
    .replace(
      /^(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Sole|Luna|Mercurio|Venere|Marte|Giove|Saturno|Urano|Nettuno|Plutone|Sol|Luna|Mercurio|Venus|Marte|J[uú]piter|Saturno|Urano|Neptuno|Plut[oó]n)\s+(?:in|en)\s+[^,.]{2,36},?\s+(?:house|casa)\s+\d{1,2}\s+/i,
      "",
    )
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
