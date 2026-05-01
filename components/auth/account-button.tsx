"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { clearChartSession } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/use-plan";

export function AccountButton() {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { plan } = usePlan();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  function openAuthModal() {
    window.dispatchEvent(new Event("sarita:open-auth"));
  }

  async function signOut() {
    await supabase.auth.signOut();
    clearChartSession();
    setMenuOpen(false);
    setUser(null);
    router.refresh();
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    const response = await fetch("/api/stripe/portal", { method: "POST" }).catch(() => null);
    if (!response?.ok) {
      setPortalLoading(false);
      return;
    }
    const { url } = (await response.json()) as { url?: string };
    if (url) {
      window.location.assign(url);
      return;
    }
    setPortalLoading(false);
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e1a2e] transition hover:text-[#5c4a24]"
      >
        {dictionary.common.account}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e1a2e] transition hover:text-[#5c4a24]"
      >
        {dictionary.common.account}
      </button>

      {menuOpen ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.75rem)] z-40 min-w-52 border border-black/12 bg-white px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
          <Link
            href="/form"
            onClick={() => setMenuOpen(false)}
            className="block border-b border-black/10 py-2 pb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24] transition hover:text-ivory"
          >
            {dictionary.common.newReading}
          </Link>
          <Link
            href="/lecturas"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.common.viewReadings}
          </Link>
          <Link
            href="/cuenta"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.nav.account}
          </Link>
          {plan === "free" ? (
            <Link
              href="/precios"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
            >
              {dictionary.nav.pricing}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory disabled:cursor-wait disabled:opacity-50"
            >
              {portalLoading ? dictionary.paywall.checkoutLoading : dictionary.paywall.manageSubscription}
            </button>
          )}
          <Link
            href="/ayuda"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.nav.help}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.common.signOut}
          </button>
        </div>
      ) : null}
    </div>
  );
}

