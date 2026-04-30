import Link from "next/link";
import { cookies } from "next/headers";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { dictionaries, defaultLocale, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

export default async function NotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dictionary = dictionaries[locale];

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <Container className="relative flex min-h-screen items-center justify-center py-10">
        <section className="max-w-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:px-10">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/70">
            404
          </p>
          <h1 className="mt-3 font-serif text-[42px] leading-tight text-ivory sm:text-[58px]">
            {dictionary.standalonePages.notFoundTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-ivory/62">
            {dictionary.standalonePages.notFoundBody}
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-dusty-gold/88 transition hover:border-dusty-gold/60 hover:bg-dusty-gold/18"
          >
            {dictionary.result.back}
          </Link>
        </section>
      </Container>
    </main>
  );
}
