import { Text } from "@react-email/components";

import type { Locale } from "@/lib/i18n";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type LavadoReceiptEmailProps = {
  amount: string;
  locale?: Locale | string | null;
};

const copy = {
  es: {
    subject: "Acceso a Lavado Intestinal Kunjal Kriya - Confirmacion",
    preview: "Tu acceso a Lavado Intestinal esta desbloqueado.",
    heading: "Acceso desbloqueado",
    body: "Has adquirido el acceso permanente al programa de Lavado Intestinal Kunjal Kriya. Puedes acceder al contenido en cualquier momento desde la seccion de Yoga Astral.",
    cta: "Ver programa",
    muted: (amount: string) => `Pago unico de ${amount} - acceso de por vida`,
  },
  en: {
    subject: "Kunjal Kriya Intestinal Cleanse access confirmed",
    preview: "Your Intestinal Cleanse access is unlocked.",
    heading: "Access unlocked",
    body: "You have permanent access to the Kunjal Kriya Intestinal Cleanse program. You can open the content anytime from the Astral Yoga section.",
    cta: "View program",
    muted: (amount: string) => `One-time payment of ${amount} - lifetime access`,
  },
  it: {
    subject: "Accesso al Lavaggio Intestinale Kunjal Kriya confermato",
    preview: "Il tuo accesso al Lavaggio Intestinale e sbloccato.",
    heading: "Accesso sbloccato",
    body: "Hai acquistato l'accesso permanente al programma di Lavaggio Intestinale Kunjal Kriya. Puoi aprire il contenuto in qualsiasi momento dalla sezione Yoga Astrale.",
    cta: "Vedi programma",
    muted: (amount: string) => `Pagamento unico di ${amount} - accesso a vita`,
  },
} as const;

function localeCopy(locale?: Locale | string | null) {
  return locale === "en" || locale === "it" ? copy[locale] : copy.es;
}

export function subject(locale?: Locale | string | null) {
  return localeCopy(locale).subject;
}

export default function LavadoReceiptEmail({ amount, locale }: LavadoReceiptEmailProps) {
  const text = localeCopy(locale);

  return (
    <EmailLayout previewText={text.preview} locale={locale ?? undefined}>
      <Text style={headingStyle}>{text.heading}</Text>
      <Text style={bodyStyle}>{text.body}</Text>
      <EmailButton href={`${getSiteUrl()}/yoga-astral/kriyas/lavado-intestinal`}>{text.cta}</EmailButton>
      <Text style={mutedStyle}>{text.muted(amount)}</Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";

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
