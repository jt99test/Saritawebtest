import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { fontSans, fontSerif } from "@/app/fonts";
import { AuthModal } from "@/components/auth/auth-modal";
import { defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

import "./globals.css";

const siteDescription =
  "Una experiencia astrológica cinematográfica para descubrir la carta natal, la lectura planetaria y un universo visual premium.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritawebtest.vercel.app"),
  title: "SARITA",
  description: siteDescription,
  openGraph: {
    title: "SARITA",
    description: siteDescription,
    siteName: "SARITA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SARITA",
    description: siteDescription,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontSerif.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-cosmic-950 font-sans text-ivory">
        {children}
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      </body>
    </html>
  );
}
