import { createElement } from "react";

import WelcomeEmail, { subject as welcomeSubject } from "@/emails/welcome";
import { sendEmail } from "@/lib/email";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type WelcomeRequestBody = {
  userId?: unknown;
};

type WelcomeProfile = {
  email: string | null;
  locale: string | null;
};

const uuidPattern = /^[0-9a-f-]{36}$/i;

export async function POST(request: Request) {
  const body = (await request.json()) as WelcomeRequestBody;
  const userId = body.userId;

  if (typeof userId !== "string" || !uuidPattern.test(userId)) {
    return new Response("Invalid user id", { status: 400 });
  }

  const { data: profile } = await createServiceSupabaseClient()
    .from("profiles")
    .select("email,locale")
    .eq("id", userId)
    .maybeSingle<WelcomeProfile>();

  if (!profile?.email) {
    return new Response("Profile email not found", { status: 404 });
  }

  void profile.locale;

  await sendEmail({
    to: profile.email,
    subject: welcomeSubject,
    react: createElement(WelcomeEmail, { firstName: "" }),
  });

  return Response.json({ ok: true });
}
