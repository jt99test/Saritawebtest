import { createElement } from "react";

import PasswordResetEmail, { passwordResetSubject } from "@/emails/password-reset";
import { sendEmail } from "@/lib/email";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PasswordResetRequestBody = {
  email?: unknown;
  locale?: unknown;
};

type ProfileLocale = {
  locale: string | null;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : defaultLocale;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PasswordResetRequestBody;
  const email = normalizeEmail(body.email);
  const requestedLocale = normalizeLocale(body.locale);

  if (!email || !email.includes("@")) {
    return Response.json({ ok: true });
  }

  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("locale")
    .eq("email", email)
    .maybeSingle<ProfileLocale>();

  const locale = profile?.locale && isLocale(profile.locale) ? profile.locale : requestedLocale;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";
  const redirectTo = `${siteUrl}/auth/callback?next=/cuenta/password`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    return Response.json({ ok: true });
  }

  await sendEmail({
    to: email,
    subject: passwordResetSubject(locale),
    react: createElement(PasswordResetEmail, {
      resetUrl: data.properties.action_link,
      locale,
    }),
  });

  return Response.json({ ok: true });
}
