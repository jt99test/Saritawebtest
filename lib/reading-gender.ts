export type ReadingGender = "female" | "male" | "neutral";

export function normalizeReadingGender(value: unknown): ReadingGender | undefined {
  return value === "female" || value === "male" || value === "neutral" ? value : undefined;
}

export function genderPromptInstruction(gender?: ReadingGender, locale?: string) {
  if (!gender) return "";

  if (locale === "en") {
    if (gender === "female") return "The person identifies as female. Use she/her when third-person pronouns are needed.";
    if (gender === "male") return "The person identifies as male. Use he/him when third-person pronouns are needed.";
    return "Use gender-neutral language when third-person pronouns are needed.";
  }

  if (locale === "it") {
    if (gender === "female") return "La persona si identifica al femminile. Usa accordi e formule femminili quando serve.";
    if (gender === "male") return "La persona si identifica al maschile. Usa accordi e formule maschili quando serve.";
    return "Usa formulazioni neutre o evita accordi di genere quando possibile.";
  }

  if (gender === "female") return "La persona se identifica en femenino. Usa femenino cuando haya adjetivos o referencias con género.";
  if (gender === "male") return "La persona se identifica en masculino. Usa masculino cuando haya adjetivos o referencias con género.";
  return "Usa lenguaje neutro o evita marcas de género cuando sea posible.";
}
