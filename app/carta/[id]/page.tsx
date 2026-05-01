import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

import { PublicChartWheel } from "@/components/chart/public-chart-wheel";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { formatSignPosition, type NatalChartData } from "@/lib/chart";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SharedChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dictionary = dictionaries[locale];
  const { data } = await createServiceSupabaseClient()
    .from("shared_charts")
    .select("chart_data")
    .eq("id", id)
    .maybeSingle();

  if (!data?.chart_data) {
    notFound();
  }

  const chart = data.chart_data as NatalChartData;
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  const ascendant = formatSignPosition(chart.meta.ascendant);

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-10 sm:py-14">
        <Container className="min-h-screen text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            {dictionary.chart.shareTitle}
          </p>
          <h1 className="mt-3 font-serif text-[48px] leading-tight text-ivory sm:text-[72px]">
            {chart.event.name}
          </h1>
          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
            {sun ? <span>{dictionary.result.points.sun}: {dictionary.result.signs[sun.sign]}</span> : null}
            {moon ? <span>{dictionary.result.points.moon}: {dictionary.result.signs[moon.sign]}</span> : null}
            <span>{dictionary.chart.ascendantLabel}: {dictionary.result.signs[ascendant.sign]}</span>
          </div>
          <div className="mt-10">
            <PublicChartWheel chart={chart} />
          </div>
          <Link
            href="/"
            className="mt-10 inline-flex border border-dusty-gold/35 bg-dusty-gold/12 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18"
          >
            {dictionary.chart.createCta}
          </Link>
        </Container>
      </section>
    </main>
  );
}
