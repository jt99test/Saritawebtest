import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  try {
    await resend.emails.send({ from, to, subject, react });
  } catch (err) {
    console.error("[email]", err);
  }
}
