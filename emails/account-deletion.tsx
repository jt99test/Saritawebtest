import { Text } from "@react-email/components";

import type { Locale } from "@/lib/i18n";

import { EmailLayout } from "./components/email-layout";

type AccountDeletionEmailProps = {
  locale?: Locale | string | null;
};

const copy = {
  es: {
    subject: "Tu cuenta SARITA ha sido eliminada",
    preview: "Tu cuenta SARITA ha sido eliminada.",
    heading: "Cuenta eliminada",
    body: "Tu cuenta y todos tus datos astrologicos han sido eliminados permanentemente de SARITA. Si esto fue un error, contacta con nosotros respondiendo a este correo.",
    muted: "Fue un honor acompanarte en tu viaje astral.",
  },
  en: {
    subject: "Your SARITA account has been deleted",
    preview: "Your SARITA account has been deleted.",
    heading: "Account deleted",
    body: "Your account and all your astrology data have been permanently deleted from SARITA. If this was a mistake, contact us by replying to this email.",
    muted: "It was an honor to accompany your astral journey.",
  },
  it: {
    subject: "Il tuo account SARITA e stato eliminato",
    preview: "Il tuo account SARITA e stato eliminato.",
    heading: "Account eliminato",
    body: "Il tuo account e tutti i tuoi dati astrologici sono stati eliminati definitivamente da SARITA. Se si tratta di un errore, contattaci rispondendo a questa email.",
    muted: "E stato un onore accompagnarti nel tuo viaggio astrale.",
  },
} as const;

function localeCopy(locale?: Locale | string | null) {
  return locale === "en" || locale === "it" ? copy[locale] : copy.es;
}

export function subject(locale?: Locale | string | null) {
  return localeCopy(locale).subject;
}

export default function AccountDeletionEmail({ locale }: AccountDeletionEmailProps) {
  const text = localeCopy(locale);

  return (
    <EmailLayout previewText={text.preview} locale={locale ?? undefined}>
      <Text style={headingStyle}>{text.heading}</Text>
      <Text style={bodyStyle}>{text.body}</Text>
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
  margin: "0",
  color: "#8f8a96",
  fontSize: "13px",
  lineHeight: "22px",
};
