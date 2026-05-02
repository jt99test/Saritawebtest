"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPinned, setMenuPinned] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      if (target instanceof Node && buttonRef.current?.contains(target)) {
        return;
      }

      setMenuOpen(false);
      setMenuPinned(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMenuPinned(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function updateMenuPosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        top: rect.bottom + 12,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuOpen]);

  function openAuthModal() {
    window.dispatchEvent(new Event("sarita:open-auth"));
  }

  async function signOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);

    if (error) {
      console.error("Sign out failed:", error.message);
      return;
    }

    clearChartSession();
    closeMenu();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPinned(false);
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

  function openMenu() {
    setMenuOpen(true);
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
    <div
      className="relative z-50"
      onMouseEnter={openMenu}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setMenuPinned((current) => {
            const nextPinned = !current;
            setMenuOpen(nextPinned);
            return nextPinned;
          });
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e1a2e] transition hover:text-[#5c4a24]"
      >
        {dictionary.common.account}
      </button>

      {menuOpen && menuPosition
        ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          className="fixed z-[1000] min-w-52 border border-black/12 bg-white px-4 py-3 text-right shadow-[0_18px_48px_rgba(0,0,0,0.16)]"
          style={{ top: menuPosition.top, right: menuPosition.right }}
        >
          <Link
            href="/form"
            onClick={closeMenu}
            className="block w-full border-b border-black/10 py-2 pb-3 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24] transition hover:text-ivory"
          >
            {dictionary.common.newReading}
          </Link>
          <Link
            href="/lecturas"
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.common.viewReadings}
          </Link>
          <Link
            href="/cuenta"
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.nav.account}
          </Link>
          {plan === "free" ? (
            <Link
              href="/precios"
              onClick={closeMenu}
              className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
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
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
          >
            {dictionary.nav.help}
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory disabled:cursor-wait disabled:opacity-50"
          >
            {signingOut ? dictionary.auth.processing : dictionary.common.signOut}
          </button>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

