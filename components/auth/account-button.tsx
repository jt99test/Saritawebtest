"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { showNotice } from "@/components/ui/notice-provider";
import { clearChartSession } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/use-plan";

type AccountButtonProps = {
  compact?: boolean;
  tone?: "light" | "night";
};

export function AccountButton({ compact = false, tone = "light" }: AccountButtonProps) {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { plan } = usePlan();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setMenuPinned] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
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
      const viewportPadding = 12;
      const mobile = window.innerWidth < 640;
      const menuWidth = mobile ? window.innerWidth - viewportPadding * 2 : Math.min(280, window.innerWidth - viewportPadding * 2);
      const preferredLeft = mobile ? viewportPadding : rect.right - menuWidth;
      setMenuPosition({
        top: rect.bottom + 12,
        left: Math.min(
          Math.max(viewportPadding, preferredLeft),
          Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding),
        ),
        width: menuWidth,
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
    showNotice({ message: dictionary.auth.signingOut, tone: "info" });
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);

    if (error) {
      console.error("Sign out failed:", error.message);
      showNotice({ message: error.message, tone: "error" });
      return;
    }

    clearChartSession();
    closeMenu();
    setUser(null);
    showNotice({ message: dictionary.auth.signedOut, tone: "success" });
    router.replace("/");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPinned(false);
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    const response = await fetch("/api/whop/portal", { method: "POST" }).catch(() => null);
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

  function showInstallPrompt() {
    window.dispatchEvent(new Event("sarita:show-install-prompt"));
    closeMenu();
  }

  const compactClassName = tone === "night"
    ? "sarita-night-pill flex h-10 w-10 items-center justify-center rounded-full text-lg transition"
    : "sarita-night-pill flex h-10 w-10 items-center justify-center rounded-full text-lg transition";
  const textClassName = tone === "night"
    ? "whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e7ff]/84 transition hover:text-[#f5d782] min-[430px]:text-xs min-[430px]:tracking-[0.2em]"
    : "max-w-[6.8rem] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e7ff]/84 transition hover:text-[#f5d782] min-[430px]:text-xs min-[430px]:tracking-[0.2em]";

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className={compact ? compactClassName : textClassName}
        aria-label={dictionary.auth.signIn}
      >
        {compact ? "♙" : dictionary.auth.signIn}
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
        className={compact ? compactClassName : textClassName}
      >
        {compact ? "♙" : dictionary.common.account}
      </button>

      {menuOpen && menuPosition
        ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          className="sarita-menu-panel fixed z-[1000] max-w-[calc(100vw-1.5rem)] px-4 py-3 text-right"
          style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
        >
          <Link
            href="/form"
            onClick={closeMenu}
            className="block w-full border-b border-[#d7e7ff]/12 py-2 pb-3 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f5d782] transition hover:text-[#ffe7a3]"
          >
            {dictionary.common.newReading}
          </Link>
          <Link
            href="/lecturas"
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782]"
          >
            {dictionary.common.viewReadings}
          </Link>
          <Link
            href="/cuenta"
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782]"
          >
            {dictionary.nav.account}
          </Link>
          {plan === "free" ? (
            <Link
              href="/precios"
              onClick={closeMenu}
              className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782]"
            >
              {dictionary.nav.pricing}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782] disabled:cursor-wait disabled:opacity-50"
            >
              {portalLoading ? dictionary.paywall.checkoutLoading : dictionary.paywall.manageSubscription}
            </button>
          )}
          <Link
            href="/ayuda"
            onClick={closeMenu}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782]"
          >
            {dictionary.nav.help}
          </Link>
          <button
            type="button"
            onClick={showInstallPrompt}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782] sm:hidden"
          >
            {dictionary.common.installApp}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="block w-full py-2 text-right text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78 transition hover:text-[#f5d782] disabled:cursor-wait disabled:opacity-50"
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

