import { Text } from "@react-email/components";

import type { Locale } from "@/lib/i18n";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type WelcomeEmailProps = {
  firstName?: string;
  locale?: Locale | string | null;
};

const copy = {
  es: {
    subject: "Bienvenida a SARITA",
    preview: "Tu carta astral te espera en SARITA.",
    greeting: "Hola",
    heading: "Bienvenida a SARITA",
    body: "Tu carta astral te espera. SARITA analiza los planetas, aspectos y transitos de tu cielo natal con una precision que va mas alla de los horoscopos de sol. Cuando estes lista, abre la aplicacion y traza tu primera carta.",
    cta: "Abrir SARITA",
    muted: "El cosmos siempre ha sabido que ibas a llegar.",
  },
  en: {
    subject: "Welcome to SARITA",
    preview: "Your birth chart is waiting in SARITA.",
    greeting: "Hello",
    heading: "Welcome to SARITA",
    body: "Your birth chart is waiting. SARITA reads the planets, aspects, and transits of your natal sky with more precision than sun-sign horoscopes. When you are ready, open the app and draw your first chart.",
    cta: "Open SARITA",
    muted: "The cosmos always knew you were on your way.",
  },
  it: {
    subject: "Benvenuta su SARITA",
    preview: "La tua carta astrale ti aspetta su SARITA.",
    greeting: "Ciao",
    heading: "Benvenuta su SARITA",
    body: "La tua carta astrale ti aspetta. SARITA legge pianeti, aspetti e transiti del tuo cielo natale con piu precisione degli oroscopi del segno solare. Quando sei pronta, apri l'applicazione e traccia la tua prima carta.",
    cta: "Apri SARITA",
    muted: "Il cosmo ha sempre saputo che saresti arrivata.",
  },
} as const;

function localeCopy(locale?: Locale | string | null) {
  return locale === "en" || locale === "it" ? copy[locale] : copy.es;
}

export function subject(locale?: Locale | string | null) {
  return localeCopy(locale).subject;
}

export default function WelcomeEmail({ firstName = "", locale }: WelcomeEmailProps) {
  const text = localeCopy(locale);
  const greeting = firstName.trim() ? `${text.greeting} ${firstName.trim()}` : text.greeting;

  return (
    <EmailLayout previewText={text.preview} locale={locale ?? undefined}>
      <Text style={kickerStyle}>{greeting}</Text>
      <Text style={headingStyle}>{text.heading}</Text>
      <Text style={bodyStyle}>{text.body}</Text>
      <EmailButton href={getSiteUrl()}>{text.cta}</EmailButton>
      <Text style={mutedStyle}>{text.muted}</Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";

const kickerStyle = {
  margin: "0 0 10px",
  color: "#b5a36e",
  fontSize: "13px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

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
