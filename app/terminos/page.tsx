import { cookies } from "next/headers";
import Link from "next/link";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

async function getDictionary() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  return dictionaries[locale];
}

export default async function TermsPage() {
  const dictionary = await getDictionary();

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-10 sm:py-14">
        <Container className="min-h-screen">
          <Link href="/" className="text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory">
            {dictionary.result.back}
          </Link>
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
              {dictionary.legal.terms}
            </p>
            <h1 className="mt-3 font-serif text-[44px] leading-tight text-ivory sm:text-[64px]">
              {dictionary.legal.termsTitle}
            </h1>
            <p className="mt-5 text-base leading-8 text-[#3a3048]">{dictionary.legal.termsIntro}</p>
            <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-[#3a3048]">
              {dictionary.legal.lastUpdated}: {dictionary.legal.updatedDate}
            </p>

            <div className="mt-10 space-y-8 border-t border-black/10 pt-8">
              {dictionary.legal.termsSections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-serif text-2xl text-ivory">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-10 border-t border-dusty-gold/16 pt-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#5c4a24]">
                {dictionary.legal.contact}
              </p>
              <a href="mailto:hola@saritashakti.com" className="mt-3 inline-block text-base text-ivory underline underline-offset-4">
                hola@saritashakti.com
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
