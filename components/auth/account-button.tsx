"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { clearChartSession } from "@/lib/chart-session";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AccountButton() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="text-xs font-medium uppercase tracking-[0.22em] text-ivory/58 transition hover:text-ivory"
      >
        Mi cuenta
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="text-xs font-medium uppercase tracking-[0.22em] text-ivory/68 transition hover:text-ivory"
      >
        Mi cuenta
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 min-w-44 border border-[rgba(236,232,223,0.1)] bg-[rgba(8,11,18,0.98)] px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.42)]">
          <Link
            href="/form"
            onClick={() => setMenuOpen(false)}
            className="block border-b border-white/8 py-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/76 transition hover:text-dusty-gold"
          >
            Generar nueva lectura
          </Link>
          <Link
            href="/lecturas"
            onClick={() => setMenuOpen(false)}
            className="block py-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/62 transition hover:text-dusty-gold"
          >
            Ver lecturas
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="block w-full py-2 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/42 transition hover:text-ivory"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
