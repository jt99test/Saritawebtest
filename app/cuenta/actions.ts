"use server";

import { redirect } from "next/navigation";
import { createElement } from "react";

import AccountDeletionEmail, { subject as accountDeletionSubject } from "@/emails/account-deletion";
import { sendEmail } from "@/lib/email";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export async function sendPasswordResetAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com"}/auth/callback`,
  });

  return { ok: !error };
}

export async function deleteAccountAction(confirmWord: string, expectedWord: string) {
  if (confirmWord !== expectedWord) {
    return { ok: false };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: accountDeletionSubject,
      react: createElement(AccountDeletionEmail),
    });
  }

  const service = createServiceSupabaseClient();
  await service.from("reading_usage_events").delete().eq("user_id", user.id);
  await service.from("readings").delete().eq("user_id", user.id);
  await service.from("synastry_partners").delete().eq("user_id", user.id);
  await service.from("profiles").delete().eq("id", user.id);
  await service.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  redirect("/");
}
