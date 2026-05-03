export type ReadingGender = "female" | "male";

export function normalizeReadingGender(value: unknown): ReadingGender | undefined {
  return value === "female" || value === "male" ? value : undefined;
}

export function genderPromptInstruction(gender?: ReadingGender, locale?: string) {
  if (!gender) return "";

  if (locale === "en") {
    if (gender === "female") return "The person identifies as female. Use she/her when third-person pronouns are needed.";
    if (gender === "male") return "The person identifies as male. Use he/him when third-person pronouns are needed.";
  }

  if (locale === "it") {
    if (gender === "female") return "La persona si identifica al femminile. Usa accordi e formule femminili quando serve.";
    if (gender === "male") return "La persona si identifica al maschile. Usa accordi e formule maschili quando serve.";
  }

  if (gender === "female") return "La persona se identifica en femenino. Usa femenino cuando haya adjetivos o referencias con género.";
  if (gender === "male") return "La persona se identifica en masculino. Usa masculino cuando haya adjetivos o referencias con género.";
  return "";
}

export function genderPromptInstructionForSubject(subject: string, gender?: ReadingGender, locale?: string) {
  if (!gender) return "";

  if (locale === "en") {
    if (gender === "female") return `When referring to ${subject}, use she/her when third-person pronouns are needed.`;
    if (gender === "male") return `When referring to ${subject}, use he/him when third-person pronouns are needed.`;
  }

  if (locale === "it") {
    if (gender === "female") return `Quando parli di ${subject}, usa accordi e formule femminili quando serve.`;
    if (gender === "male") return `Quando parli di ${subject}, usa accordi e formule maschili quando serve.`;
  }

  if (gender === "female") return `Cuando hables de ${subject}, usa femenino cuando haya adjetivos o referencias con género.`;
  if (gender === "male") return `Cuando hables de ${subject}, usa masculino cuando haya adjetivos o referencias con género.`;
  return "";
}

export function grammarPromptInstruction(locale?: string) {
  if (locale === "en") {
    return "Write with polished grammar, natural punctuation, correct capitalization after periods, and no repeated opener across sections.";
  }

  if (locale === "it") {
    return "Cura grammatica, accenti, punteggiatura naturale, maiuscole dopo il punto e concordanze. Non ripetere sempre lo stesso incipit.";
  }

  return "Cuida la ortografía: acentos, signos de apertura, puntuación natural, mayúscula después de punto y concordancia. No repitas siempre el mismo inicio.";
}
