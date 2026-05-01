import { cookies } from "next/headers";
import Link from "next/link";

import { PricingPlans } from "@/components/pricing/pricing-plans";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

async function getDictionary() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  return dictionaries[locale];
}

export default async function PricingPage() {
  const dictionary = await getDictionary();

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-10 sm:py-14">
        <Container className="min-h-screen">
          <div className="mx-auto max-w-5xl text-center">
            <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#6f613a]">
              {dictionary.pricing.eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-[48px] leading-tight text-ivory sm:text-[72px]">
              {dictionary.pricing.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#3a3048]">
              {dictionary.pricing.subtitle}
            </p>
            <PricingPlans dictionary={dictionary} />
          </div>

          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-center font-serif text-4xl text-ivory">{dictionary.pricing.faqTitle}</h2>
            <div className="mt-8 border-t border-black/10">
              {dictionary.pricing.faqs.map((faq) => (
                <details key={faq.question} className="group border-b border-black/10 py-5">
                  <summary className="cursor-pointer list-none font-serif text-xl text-ivory">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-16 text-center">
            <Link
              href="/form"
              className="inline-flex items-center justify-center border border-dusty-gold/35 bg-dusty-gold/12 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18"
            >
              {dictionary.pricing.startFree}
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
