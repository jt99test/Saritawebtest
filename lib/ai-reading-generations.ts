import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AiReadingScope =
  | "planet"
  | "general"
  | "lunar"
  | "transit"
  | "solar_return"
  | "synastry";

type AiReadingGenerationRow = {
  content: unknown;
};

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

function normalizedLocale(locale?: string) {
  return locale === "en" || locale === "it" ? locale : "es";
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
    .upsert(
      {
        user_id: user.id,
        reading_id: readingId,
        scope,
        item_key: itemKey,
        locale: normalizedLocale(locale),
        content,
      },
      {
        onConflict: "reading_id,scope,item_key,locale",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    console.error("AI reading cache save failed:", error.message);
  }
}
