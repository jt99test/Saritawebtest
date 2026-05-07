import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type PasswordResetEmailProps = {
  resetUrl: string;
  locale?: string;
};

const copy = {
  es: {
    subject: "Restablecer contrasena - SARITA",
    preview: "Restablece tu contrasena SARITA.",
    heading: "Restablecer contrasena",
    body: "Hemos recibido una solicitud para restablecer la contrasena de tu cuenta SARITA.",
    cta: "Restablecer contrasena",
    linkHelp: "Si el boton no abre, copia y pega este enlace en tu navegador:",
    muted: "Este enlace expira pronto. Si no solicitaste esto, puedes ignorar este mensaje.",
  },
  en: {
    subject: "Reset your SARITA password",
    preview: "Reset your SARITA password.",
    heading: "Reset your password",
    body: "We received a request to reset the password for your SARITA account.",
    cta: "Reset password",
    linkHelp: "If the button does not open, copy and paste this link into your browser:",
    muted: "This link expires soon. If you did not request this, you can ignore this email.",
  },
  it: {
    subject: "Reimposta la password SARITA",
    preview: "Reimposta la password del tuo account SARITA.",
    heading: "Reimposta la password",
    body: "Abbiamo ricevuto una richiesta per reimpostare la password del tuo account SARITA.",
    cta: "Reimposta password",
    linkHelp: "Se il pulsante non si apre, copia e incolla questo link nel browser:",
    muted: "Questo link scade a breve. Se non hai richiesto tu il reset, puoi ignorare questa email.",
  },
} as const;

function localeCopy(locale?: string) {
  return locale === "en" || locale === "it" ? copy[locale] : copy.es;
}

export function passwordResetSubject(locale?: string) {
  return localeCopy(locale).subject;
}

export const subject = copy.es.subject;

export default function PasswordResetEmail({ resetUrl, locale }: PasswordResetEmailProps) {
  const text = localeCopy(locale);

  return (
    <EmailLayout previewText={text.preview} locale={locale}>
      <Text style={headingStyle}>{text.heading}</Text>
      <Text style={bodyStyle}>{text.body}</Text>
      <EmailButton href={resetUrl}>{text.cta}</EmailButton>
      <Text style={linkHelpStyle}>
        {text.linkHelp}
        <br />
        <a href={resetUrl} style={rawLinkStyle}>
          {resetUrl}
        </a>
      </Text>
      <Text style={mutedStyle}>{text.muted}</Text>
    </EmailLayout>
  );
}

const headingStyle = {
  margin: "0 0 22px",
  color: "#ece8df",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "32px",
  lineHeight: "38px",
};

const bodyStyle = {
  margin: "0 0 28px",
  color: "#d8d3c8",
  fontSize: "16px",
  lineHeight: "27px",
};

const mutedStyle = {
  margin: "28px 0 0",
  color: "#8f8a96",
  fontSize: "13px",
  lineHeight: "22px",
};

const linkHelpStyle = {
  margin: "22px 0 0",
  color: "#8f8a96",
  fontSize: "12px",
  lineHeight: "20px",
  wordBreak: "break-word" as const,
};

const rawLinkStyle = {
  color: "#b5a36e",
  textDecoration: "underline",
};
