import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  children: ReactNode;
  previewText: string;
  locale?: string;
};

export function EmailLayout({ children, previewText, locale }: EmailLayoutProps) {
  void Button;
  void Column;
  void Img;
  void Link;
  void Row;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";
  const footer = locale === "en"
    ? {
        product: "Western Astrology",
        account: `To manage your account or cancel your subscription, visit ${siteUrl}`,
      }
    : locale === "it"
      ? {
          product: "Astrologia occidentale",
          account: `Per gestire il tuo account o annullare l'abbonamento, entra su ${siteUrl}`,
        }
      : {
          product: "Astrologia Occidental",
          account: `Para gestionar tu cuenta o cancelar tu suscripcion, entra en ${siteUrl}`,
        };

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>
          {`
            :root {
              color-scheme: dark;
              supported-color-schemes: dark;
            }
            @media (prefers-color-scheme: dark) {
              body,
              table,
              td {
                background-color: #0a0a14 !important;
                color: #ece8df !important;
              }
              .sarita-email-container,
              .sarita-email-panel {
                background-color: #111122 !important;
              }
              .sarita-email-header,
              .sarita-email-footer {
                background-color: #0a0a14 !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle} className="sarita-email-container">
          <Section style={headerStyle} className="sarita-email-header">
            <Text style={logoStyle}>SARITA</Text>
            <Hr style={ruleStyle} />
          </Section>

          <Section style={contentStyle} className="sarita-email-panel">{children}</Section>

          <Section style={footerStyle} className="sarita-email-footer">
            <Text style={footerTextStyle}>© 2026 SARITA · {footer.product}</Text>
            <Text style={footerTextStyle}>{footer.account}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  margin: "0",
  background: "#0a0a14",
  backgroundColor: "#0a0a14",
  backgroundImage: "linear-gradient(#0a0a14, #0a0a14)",
  color: "#ece8df",
  colorScheme: "dark",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  background: "#111122",
  backgroundColor: "#111122",
  backgroundImage: "linear-gradient(#111122, #111122)",
  border: "1px solid #2a2a3a",
};

const headerStyle = {
  width: "100%",
  background: "#0a0a14",
  backgroundColor: "#0a0a14",
  backgroundImage: "linear-gradient(#0a0a14, #0a0a14)",
  textAlign: "center" as const,
};

const logoStyle = {
  margin: "0",
  padding: "28px 0 22px",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "28px",
  letterSpacing: "0.3em",
  color: "#b5a36e",
};

const ruleStyle = {
  margin: "0",
  borderColor: "#2a2a3a",
};

const contentStyle = {
  padding: "40px 48px",
};

const footerStyle = {
  background: "#0a0a14",
  backgroundColor: "#0a0a14",
  backgroundImage: "linear-gradient(#0a0a14, #0a0a14)",
  padding: "24px 48px",
  textAlign: "center" as const,
};

const footerTextStyle = {
  margin: "0 0 8px",
  color: "#666680",
  fontSize: "12px",
  lineHeight: "20px",
};
