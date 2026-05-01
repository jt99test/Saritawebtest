import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSettings } from "@/components/account/account-settings";
import { ManageBillingButton } from "@/components/account/manage-billing-button";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { stripe } from "@/lib/stripe";

async function getLocaleDictionary() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  return { dictionary: dictionaries[locale], locale };
}

export default async function AccountPage() {
  const { dictionary, locale } = await getLocaleDictionary();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan,billing_period,stripe_customer_id,stripe_subscription_id,email")
    .eq("id", user.id)
    .maybeSingle();
  const plan = profile?.plan ?? "free";
  const planLabel =
    plan === "pro" ? dictionary.paywall.proName : plan === "avanzado" ? dictionary.paywall.avanzadoName : dictionary.pricing.free;
  let renewalDate = dictionary.account.noRenewalDate;

  if (profile?.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      const periodEnd = subscription.items.data[0]?.current_period_end;
      if (periodEnd) {
        renewalDate = new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(periodEnd * 1000));
      }
    } catch {}
  }

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-10 sm:py-14">
        <Container className="min-h-screen">
          <div className="mx-auto max-w-3xl">
            <Link href="/" className="text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory">
              {dictionary.result.back}
            </Link>
            <h1 className="mt-10 font-serif text-[48px] leading-tight text-ivory sm:text-[64px]">
              {dictionary.account.title}
            </h1>

            <div className="mt-10 space-y-8">
              <section className="border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#6f613a]">
                  {dictionary.account.plan}
                </p>
                <h2 className="mt-3 font-serif text-4xl text-ivory">{planLabel}</h2>
                <p className="mt-3 text-sm text-[#3a3048]">
                  {dictionary.account.billingPeriod}: {profile?.billing_period ?? dictionary.pricing.free}
                </p>
                <p className="mt-2 text-sm text-[#3a3048]">
                  {dictionary.account.renewalDate}: {renewalDate}
                </p>
                {plan === "free" ? (
                  <Link
                    href="/precios"
                    className="mt-6 inline-flex border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18"
                  >
                    {dictionary.account.upgradePlan}
                  </Link>
                ) : (
                  <ManageBillingButton dictionary={dictionary} />
                )}
              </section>

              <AccountSettings
                dictionary={dictionary}
                email={user.email ?? profile?.email ?? ""}
                confirmWord={dictionary.account.deleteConfirmWord}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
