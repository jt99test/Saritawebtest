import type { ReadingGender } from "@/lib/reading-gender";

// Version both browser and server caches: older reversed readings omitted chart A.
export function synastryReadingCacheKey(
  subjectHash: string,
  partnerHash: string,
  locale?: string,
  gender?: ReadingGender,
  partnerGender?: ReadingGender,
) {
  const language = locale === "en" || locale === "it" ? locale : "es";
  return `synastry:v7:${subjectHash}:${partnerHash}:${language}:${gender || "unspecified"}:${partnerGender || "partner-unspecified"}`;
}
