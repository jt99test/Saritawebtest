import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AiReadingScope =
  | "planet"
  | "general"
  | "lunar"
  | "transit"
  | "solar_return"
  | "synastry"
  | "astrocartography";

type AiReadingGenerationRow = {
  content: unknown;
};

const GENERATION_STATUS_KEY = "__saritaGenerationStatus";
const GENERATING_CONTENT = { [GENERATION_STATUS_KEY]: "generating" };
const FAILED_CONTENT = { [GENERATION_STATUS_KEY]: "failed" };

type AiReadingCacheInput = {
  supabase: SupabaseClient;
  user: User;
  readingId: string | undefined;
  scope: AiReadingScope;
  itemKey: string;
  locale?: string;
};

type SetAiReadingCacheInput = AiReadingCacheInput & {
  content: unknown;
};

export type AiReadingReservation =
  | { ok: true; reserved: true }
  | { ok: true; reserved: false; content: unknown }
  | { ok: false; response: Response };

function normalizedLocale(locale?: string) {
  return locale === "en" || locale === "it" ? locale : "es";
}

export function getAiGenerationStatus(content: unknown): "generating" | "failed" | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return null;
  }

  const status = (content as Record<string, unknown>)[GENERATION_STATUS_KEY];
  return status === "generating" || status === "failed" ? status : null;
}

export function aiGenerationStatusResponse(status: "generating" | "failed") {
  return new Response(status === "generating" ? "Generation in progress" : "Generation failed", {
    status: status === "generating" ? 409 : 422,
    headers: {
      "Cache-Control": "no-cache",
      "X-Sarita-Generation-Status": status,
    },
  });
}

export async function validateReadingGenerationAccess({
  supabase,
  user,
  readingId,
}: Pick<AiReadingCacheInput, "supabase" | "user" | "readingId">) {
  if (!readingId) {
    return { ok: false as const, response: new Response("readingId required", { status: 400 }) };
  }

  const { data, error } = await supabase
    .from("readings")
    .select("id")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Reading access check failed:", error.message);
    return { ok: false as const, response: new Response("Reading access check failed", { status: 500 }) };
  }

  if (!data) {
    return { ok: false as const, response: new Response("Reading not found", { status: 404 }) };
  }

  return { ok: true as const };
}

export async function getCachedAiReading({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
}: AiReadingCacheInput) {
  if (!readingId) return null;

  const { data, error } = await supabase
    .from("ai_reading_generations")
    .select("content")
    .eq("user_id", user.id)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalizedLocale(locale))
    .maybeSingle<AiReadingGenerationRow>();

  if (error) {
    console.error("AI reading cache lookup failed:", error.message);
    return null;
  }

  return data?.content ?? null;
}

export async function reserveAiReadingGeneration({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
}: AiReadingCacheInput): Promise<AiReadingReservation> {
  if (!readingId) {
    return { ok: false, response: new Response("readingId required", { status: 400 }) };
  }

  const normalized = normalizedLocale(locale);
  const { error } = await supabase
    .from("ai_reading_generations")
    .insert({
      user_id: user.id,
      reading_id: readingId,
      scope,
      item_key: itemKey,
      locale: normalized,
      content: GENERATING_CONTENT,
    });

  if (!error) {
    return { ok: true, reserved: true };
  }

  if (error.code !== "23505") {
    console.error("AI reading reservation failed:", error.message);
    return { ok: false, response: new Response("AI reading reservation failed", { status: 500 }) };
  }

  const content = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope,
    itemKey,
    locale: normalized,
  });

  const status = getAiGenerationStatus(content);
  if (status) {
    return { ok: false, response: aiGenerationStatusResponse(status) };
  }

  return { ok: true, reserved: false, content };
}

export async function setCachedAiReading({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
  content,
}: SetAiReadingCacheInput) {
  if (!readingId) return;

  const { error } = await supabase
    .from("ai_reading_generations")
    .update(
      {
        content,
      },
    )
    .eq("user_id", user.id)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalizedLocale(locale));

  if (error) {
    console.error("AI reading cache save failed:", error.message);
  }
}

export async function markAiReadingGenerationFailed(input: AiReadingCacheInput) {
  await setCachedAiReading({ ...input, content: FAILED_CONTENT });
}
