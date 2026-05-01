import { Resend } from "resend";
import type { ReactElement } from "react";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping");
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  try {
    await resend.emails.send({ from, to, subject, react });
  } catch (err) {
    console.error("[email]", err);
  }
}
