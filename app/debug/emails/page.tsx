import { createElement } from "react";
import { render } from "@react-email/render";
import Link from "next/link";
import { notFound } from "next/navigation";

import AccountDeletionEmail from "@/emails/account-deletion";
import LavadoReceiptEmail from "@/emails/lavado-receipt";
import WelcomeEmail from "@/emails/welcome";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type EmailPreviewPageProps = {
  searchParams: Promise<{
    locale?: string | string[];
    template?: string | string[];
  }>;
};

const previews = {
  welcome: {
    label: "Welcome",
    render: (locale: Locale) => createElement(WelcomeEmail, { firstName: "Janette", locale }),
  },
  "account-deletion": {
    label: "Account deletion",
    render: (locale: Locale) => createElement(AccountDeletionEmail, { locale }),
  },
  "lavado-receipt": {
    label: "Lavado receipt",
    render: (locale: Locale) => createElement(LavadoReceiptEmail, { amount: "EUR 49.99", locale }),
  },
} as const;

type PreviewId = keyof typeof previews;

function getPreviewId(value: string | string[] | undefined): PreviewId {
  const id = Array.isArray(value) ? value[0] : value;
  return id && id in previews ? (id as PreviewId) : "welcome";
}

function getPreviewLocale(value: string | string[] | undefined): Locale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale && isLocale(locale) ? locale : "es";
}

export default async function EmailPreviewPage({ searchParams }: EmailPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const previewId = getPreviewId(params.template);
  const locale = getPreviewLocale(params.locale);
  const preview = previews[previewId];
  const html = await render(preview.render(locale));

  return (
    <main className="min-h-screen bg-[#030814] px-4 py-6 text-[#fffaf0] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#f5d782]">Debug only</p>
            <h1 className="mt-2 font-serif text-3xl">Email previews</h1>
          </div>
          <Link href="/" className="text-sm text-[#d7e7ff]/72 underline underline-offset-4 hover:text-[#f5d782]">
            Home
          </Link>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {Object.entries(previews).map(([id, item]) => (
            <Link
              key={id}
              href={`/debug/emails?template=${id}&locale=${locale}`}
              className={[
                "border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                id === previewId
                  ? "border-[#f5d782] bg-[#f5d782]/12 text-[#f5d782]"
                  : "border-[#d7e7ff]/18 text-[#d7e7ff]/72 hover:border-[#f5d782]/45 hover:text-[#f5d782]",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="mt-3 flex flex-wrap gap-2">
          {(["es", "it", "en"] as const).map((id) => (
            <Link
              key={id}
              href={`/debug/emails?template=${previewId}&locale=${id}`}
              className={[
                "border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                id === locale
                  ? "border-[#f5d782] bg-[#f5d782]/12 text-[#f5d782]"
                  : "border-[#d7e7ff]/18 text-[#d7e7ff]/72 hover:border-[#f5d782]/45 hover:text-[#f5d782]",
              ].join(" ")}
            >
              {id}
            </Link>
          ))}
        </nav>

        <section className="mt-6 overflow-hidden border border-[#d7e7ff]/18 bg-white">
          <iframe
            title={`${preview.label} email preview`}
            srcDoc={html}
            className="h-[760px] w-full bg-white"
          />
        </section>
      </div>
    </main>
  );
}
