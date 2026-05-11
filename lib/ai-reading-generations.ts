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
const DEFAULT_DAILY_AI_READING_LIMIT = 10;

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

function dailyAiReadingLimit() {
  const configured = Number(process.env.AI_READING_DAILY_LIMIT);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_DAILY_AI_READING_LIMIT;
}

function normalizedLocale(locale?: string) {
  return locale === "en" || locale === "it" ? locale : "es";
}

function isMissingRateLimitTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.message?.includes("ai_reading_request_events") ||
    error.message?.toLowerCase().includes("does not exist")
  );
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

  const content = await getCachedAiReading({
    supabase,
    user,
    readingId,
    scope,
    itemKey,
    locale,
  });

  const status = getAiGenerationStatus(content);
  if (status === "generating") {
    return { ok: false, response: aiGenerationStatusResponse(status) };
  }

  if (content && status !== "failed") {
    return { ok: true, reserved: false, content };
  }

  const limit = dailyAiReadingLimit();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from("ai_reading_request_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayStart.toISOString());

  if (isMissingRateLimitTable(countError)) {
    const { count: fallbackCount, error: fallbackError } = await supabase
      .from("ai_reading_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", dayStart.toISOString());

    if (fallbackError) {
      console.error("AI reading fallback rate limit lookup failed:", fallbackError.message);
      return { ok: false, response: new Response("AI reading rate limit check failed", { status: 500 }) };
    }

    if ((fallbackCount ?? 0) >= limit) {
      return {
        ok: false,
        response: new Response("Daily AI reading limit reached", {
          status: 429,
          headers: {
            "Cache-Control": "no-cache",
            "Retry-After": String(Math.max(1, Math.ceil((dayStart.getTime() + 86_400_000 - Date.now()) / 1000))),
            "X-Sarita-AI-Limit": String(limit),
            "X-Sarita-AI-Remaining": "0",
          },
        }),
      };
    }
  } else if (countError) {
    console.error("AI reading rate limit lookup failed:", countError.message);
    return { ok: false, response: new Response("AI reading rate limit check failed", { status: 500 }) };
  } else if ((count ?? 0) >= limit) {
    return {
      ok: false,
      response: new Response("Daily AI reading limit reached", {
        status: 429,
        headers: {
          "Cache-Control": "no-cache",
          "Retry-After": String(Math.max(1, Math.ceil((dayStart.getTime() + 86_400_000 - Date.now()) / 1000))),
          "X-Sarita-AI-Limit": String(limit),
          "X-Sarita-AI-Remaining": "0",
        },
      }),
    };
  }

  const { error: eventError } = await supabase
    .from("ai_reading_request_events")
    .insert({
      user_id: user.id,
      reading_id: readingId,
      scope,
    });

  if (eventError) {
    if (isMissingRateLimitTable(eventError)) {
      console.warn("AI reading request event table missing; falling back without event logging.");
    } else {
    console.error("AI reading rate limit event failed:", eventError.message);
    return { ok: false, response: new Response("AI reading rate limit event failed", { status: 500 }) };
    }
  }

  const normalized = normalizedLocale(locale);
  if (status === "failed") {
    const { error } = await supabase
      .from("ai_reading_generations")
      .update({ content: GENERATING_CONTENT })
      .eq("user_id", user.id)
      .eq("reading_id", readingId)
      .eq("scope", scope)
      .eq("item_key", itemKey)
      .eq("locale", normalized);

    if (error) {
      console.error("AI reading generation reservation update failed:", error.message);
      return { ok: false, response: new Response("AI reading generation reservation failed", { status: 500 }) };
    }

    return { ok: true, reserved: true };
  }

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

  if (error) {
    const latestContent = await getCachedAiReading({ supabase, user, readingId, scope, itemKey, locale });
    const latestStatus = getAiGenerationStatus(latestContent);
    if (latestStatus === "generating" || latestStatus === "failed") {
      return { ok: false, response: aiGenerationStatusResponse(latestStatus) };
    }
    if (latestContent) {
      return { ok: true, reserved: false, content: latestContent };
    }

    console.error("AI reading generation reservation insert failed:", error.message);
    return { ok: false, response: new Response("AI reading generation reservation failed", { status: 500 }) };
  }

  return { ok: true, reserved: true };
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

  const normalized = normalizedLocale(locale);
  const { data: updated, error: updateError } = await supabase
    .from("ai_reading_generations")
    .update({ content })
    .eq("user_id", user.id)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalized)
    .select("id")
    .maybeSingle();

  if (!updateError && updated) {
    return;
  }

  const { error } = await supabase
    .from("ai_reading_generations")
    .upsert(
      {
        user_id: user.id,
        reading_id: readingId,
        scope,
        item_key: itemKey,
        locale: normalized,
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

export async function markAiReadingGenerationFailed(input: AiReadingCacheInput) {
  await setCachedAiReading({ ...input, content: FAILED_CONTENT });
}
