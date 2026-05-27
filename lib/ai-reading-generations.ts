import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/admin";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

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
  created_at?: string | null;
};

const GENERATION_STATUS_KEY = "__saritaGenerationStatus";
const GENERATING_CONTENT = { [GENERATION_STATUS_KEY]: "generating" };
const FAILED_CONTENT = { [GENERATION_STATUS_KEY]: "failed" };
const DEFAULT_DAILY_AI_READING_LIMIT = 150;
const STALE_GENERATION_MS = 2 * 60 * 1000;

type AiReadingCacheInput = {
  supabase: SupabaseClient;
  user: User;
  readingId: string | undefined;
  scope: AiReadingScope;
  itemKey: string;
  locale?: string;
  cacheUserId?: string;
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

function getCacheUserId({ user, cacheUserId }: Pick<AiReadingCacheInput, "user" | "cacheUserId">) {
  return cacheUserId ?? user.id;
}

function getCacheSupabase({ supabase, user, cacheUserId }: Pick<AiReadingCacheInput, "supabase" | "user" | "cacheUserId">) {
  return getCacheUserId({ user, cacheUserId }) === user.id ? supabase : createServiceSupabaseClient();
}

function isMissingRateLimitTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.message?.includes("ai_reading_request_events") ||
    error.message?.toLowerCase().includes("does not exist")
  );
}

function isMissingCacheTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.message?.includes("ai_reading_generations") ||
    error.message?.toLowerCase().includes("does not exist")
  );
}

function isMissingCreatedAtColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42703" || error.code === "PGRST204" || message.includes("created_at");
}

function isStaleGenerating(content: unknown, createdAt?: string | null) {
  if (getAiGenerationStatus(content) !== "generating") return false;
  if (!createdAt) return true;

  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return true;

  return Date.now() - createdTime > STALE_GENERATION_MS;
}

async function getAiReadingGenerationRow({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
  cacheUserId,
}: AiReadingCacheInput) {
  if (!readingId) return { row: null as AiReadingGenerationRow | null, error: null };

  const ownerId = getCacheUserId({ user, cacheUserId });
  const client = getCacheSupabase({ supabase, user, cacheUserId });
  const query = client
    .from("ai_reading_generations")
    .select("content, created_at")
    .eq("user_id", ownerId)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalizedLocale(locale))
    .maybeSingle<AiReadingGenerationRow>();

  const { data, error } = await query;
  if (!error) return { row: data ?? null, error: null };

  if (!isMissingCreatedAtColumn(error)) {
    return { row: null, error };
  }

  const fallback = await client
    .from("ai_reading_generations")
    .select("content")
    .eq("user_id", ownerId)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalizedLocale(locale))
    .maybeSingle<Pick<AiReadingGenerationRow, "content">>();

  return {
    row: fallback.data ? { content: fallback.data.content, created_at: null } : null,
    error: fallback.error,
  };
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
    .select("id,user_id")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; user_id: string }>();

  if (error) {
    console.error("Reading access check failed:", error.message);
    return { ok: false as const, response: new Response("Reading access check failed", { status: 500 }) };
  }

  if (!data) {
    if (!isAdminEmail(user.email)) {
      return { ok: false as const, response: new Response("Reading not found", { status: 404 }) };
    }

    const service = createServiceSupabaseClient();
    const { data: adminData, error: adminError } = await service
      .from("readings")
      .select("id,user_id")
      .eq("id", readingId)
      .maybeSingle<{ id: string; user_id: string }>();

    if (adminError) {
      console.error("Admin reading access check failed:", adminError.message);
      return { ok: false as const, response: new Response("Reading access check failed", { status: 500 }) };
    }

    if (!adminData) {
      return { ok: false as const, response: new Response("Reading not found", { status: 404 }) };
    }

    return { ok: true as const, cacheUserId: adminData.user_id };
  }

  return { ok: true as const, cacheUserId: data.user_id };
}

export async function getCachedAiReading({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
  cacheUserId,
}: AiReadingCacheInput) {
  if (!readingId) return null;

  const { row, error } = await getAiReadingGenerationRow({
    supabase,
    user,
    readingId,
    scope,
    itemKey,
    locale,
    cacheUserId,
  });

  if (error) {
    console.error("AI reading cache lookup failed:", error.message);
    return null;
  }

  return row?.content ?? null;
}

export async function reserveAiReadingGeneration({
  supabase,
  user,
  readingId,
  scope,
  itemKey,
  locale,
  cacheUserId,
}: AiReadingCacheInput): Promise<AiReadingReservation> {
  if (!readingId) {
    return { ok: false, response: new Response("readingId required", { status: 400 }) };
  }

  const ownerId = getCacheUserId({ user, cacheUserId });
  const client = getCacheSupabase({ supabase, user, cacheUserId });
  const { row: cachedRow, error: cacheError } = await getAiReadingGenerationRow({
    supabase,
    user,
    readingId,
    scope,
    itemKey,
    locale,
    cacheUserId,
  });

  if (cacheError) {
    if (isMissingCacheTable(cacheError)) {
      console.warn("AI reading generation cache table missing; generating without cache reservation.");
      return { ok: true, reserved: true };
    }

    console.warn("AI reading cache lookup failed; generating without cache reservation.", cacheError.message);
    return { ok: true, reserved: true };
  }

  const content = cachedRow?.content ?? null;
  const status = getAiGenerationStatus(content);
  const staleGenerating = isStaleGenerating(content, cachedRow?.created_at);

  if (status === "generating" && !staleGenerating) {
    return { ok: false, response: aiGenerationStatusResponse(status) };
  }

  if (content && status !== "failed" && !staleGenerating) {
    return { ok: true, reserved: false, content };
  }

  if (!isAdminEmail(user.email) && status !== "failed" && !staleGenerating) {
    const limit = dailyAiReadingLimit();
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("ai_reading_request_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", dayStart.toISOString());

    if (isMissingRateLimitTable(countError)) {
      console.warn("AI reading request event table missing; rate limit will activate after the migration is applied.");
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
  }

  const normalized = normalizedLocale(locale);
  if (status === "failed" || staleGenerating) {
    let { error } = await client
      .from("ai_reading_generations")
      .update({ content: GENERATING_CONTENT, created_at: new Date().toISOString() })
      .eq("user_id", ownerId)
      .eq("reading_id", readingId)
      .eq("scope", scope)
      .eq("item_key", itemKey)
      .eq("locale", normalized);

    if (isMissingCreatedAtColumn(error)) {
      const fallback = await client
        .from("ai_reading_generations")
        .update({ content: GENERATING_CONTENT })
        .eq("user_id", ownerId)
        .eq("reading_id", readingId)
        .eq("scope", scope)
        .eq("item_key", itemKey)
        .eq("locale", normalized);

      error = fallback.error;
    }

    if (error) {
      console.warn("AI reading generation reservation update failed; generating without cache reservation.", error.message);
    }

    return { ok: true, reserved: true };
  }

  const { error } = await client
    .from("ai_reading_generations")
    .insert({
      user_id: ownerId,
      reading_id: readingId,
      scope,
      item_key: itemKey,
      locale: normalized,
      content: GENERATING_CONTENT,
    });

  if (error) {
    const latestContent = await getCachedAiReading({ supabase, user, readingId, scope, itemKey, locale, cacheUserId });
    const latestStatus = getAiGenerationStatus(latestContent);
    if (latestStatus === "generating" || latestStatus === "failed") {
      return { ok: false, response: aiGenerationStatusResponse(latestStatus) };
    }
    if (latestContent) {
      return { ok: true, reserved: false, content: latestContent };
    }

    console.warn("AI reading generation reservation insert failed; generating without cache reservation.", error.message);
    return { ok: true, reserved: true };
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
  cacheUserId,
}: SetAiReadingCacheInput) {
  if (!readingId) return;

  const normalized = normalizedLocale(locale);
  const ownerId = getCacheUserId({ user, cacheUserId });
  const client = getCacheSupabase({ supabase, user, cacheUserId });
  const { data: updated, error: updateError } = await client
    .from("ai_reading_generations")
    .update({ content })
    .eq("user_id", ownerId)
    .eq("reading_id", readingId)
    .eq("scope", scope)
    .eq("item_key", itemKey)
    .eq("locale", normalized)
    .select("id")
    .maybeSingle();

  if (!updateError && updated) {
    return;
  }

  const { error } = await client
    .from("ai_reading_generations")
    .upsert(
      {
        user_id: ownerId,
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
