import type { Metadata } from "next";
import { Suspense } from "react";

import { fontSans, fontSerif } from "@/app/fonts";
import { AuthModal } from "@/components/auth/auth-modal";

import "./globals.css";

export const metadata: Metadata = {
  title: "SARITA",
  description:
    "Una experiencia astrológica cinematográfica para descubrir la carta natal, la lectura planetaria y un universo visual premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
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
