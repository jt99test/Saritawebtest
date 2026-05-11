import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { fontSans, fontSerif } from "@/app/fonts";
import { AuthModal } from "@/components/auth/auth-modal";
import { InstallAppPrompt } from "@/components/ui/install-app-prompt";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { NoticeProvider } from "@/components/ui/notice-provider";
import { defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

import "./globals.css";

const siteDescription =
  "SARITA astrology readings, natal charts, lunar guidance, transits, and astral yoga.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com"),
  title: "SARITA",
  description: siteDescription,
  appleWebApp: {
    capable: true,
    title: "SARITA",
    statusBarStyle: "black-translucent",
  },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a14",
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
        <CookieBanner />
        <InstallAppPrompt />
        <NoticeProvider />
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      </body>
    </html>
  );
}
