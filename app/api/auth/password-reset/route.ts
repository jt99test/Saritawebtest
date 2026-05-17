import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PasswordResetRequestBody = {
  email?: unknown;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PasswordResetRequestBody;
  const email = normalizeEmail(body.email);

  if (!email || !email.includes("@")) {
    return Response.json({ ok: true });
  }

  const supabase = createServiceSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";
  const redirectTo = `${siteUrl}/auth/callback?next=/cuenta/password`;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return Response.json({ ok: true });
}
