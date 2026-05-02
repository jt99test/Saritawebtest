"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { clearChartSession } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "sign-up" | "sign-in";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const authRequired = searchParams.get("auth") === "required";
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(() => (authRequired ? "sign-in" : "sign-up"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setMessage(null);
    };

    window.addEventListener("sarita:open-auth", handleOpen);
    return () => window.removeEventListener("sarita:open-auth", handleOpen);
  }, []);

  function closeModal() {
    setOpen(false);
    setMessage(null);

    if (searchParams.get("auth")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("auth");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl);
    }
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const response =
      mode === "sign-up"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setPending(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (mode === "sign-up" && !response.data.session) {
      setMessage(dictionary.auth.checkEmail);
      return;
    }

    if (mode === "sign-up" && response.data.user?.id) {
      void fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: response.data.user.id }),
      });
    }

    clearChartSession();
    closeModal();
    router.refresh();
  }

  async function handleGoogleAuth() {
    setPending(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setPending(false);
      setMessage(error.message);
    }
  }

  if (!open && !authRequired) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1e1a2e]/35 px-4 backdrop-blur-[10px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={dictionary.common.close}
        onClick={closeModal}
      />

      <div className="relative w-full max-w-[430px] border border-black/10 bg-cosmic-950 px-6 py-6 shadow-[0_28px_90px_rgba(30,26,46,0.22)]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 text-[18px] leading-none text-[#3a3048] transition hover:text-[#5c4a24]"
          aria-label={dictionary.common.close}
        >
          ×
        </button>

        <div className="mb-6 flex border-b border-black/10">
          {[
            { id: "sign-up", label: dictionary.auth.signUp },
            { id: "sign-in", label: dictionary.auth.signIn },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id as AuthMode);
                setMessage(null);
              }}
              className={[
                "border-b px-4 pb-3 pt-1 text-[12px] font-semibold uppercase tracking-[0.2em] transition",
                mode === tab.id
                  ? "border-dusty-gold text-dusty-gold"
                  : "border-transparent text-[#3a3048] hover:text-[#5c4a24]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={pending}
          className="flex w-full items-center justify-center gap-3 border border-black/10 bg-white px-4 py-3 text-sm text-[#3a3048] transition hover:bg-black/[0.02] disabled:cursor-wait disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.41 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.28.31-1.88V7.53H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.47l3.33-2.59Z" />
            <path fill="#EA4335" d="M12 6c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 3 14.69 2 12 2a10 10 0 0 0-8.92 5.53l3.33 2.59C7.2 7.76 9.4 6 12 6Z" />
          </svg>
          {dictionary.auth.continueWithGoogle}
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-black/10" />
          <span className="text-[12px] uppercase tracking-[0.2em] text-[#3a3048]">{dictionary.auth.or}</span>
          <div className="flex-1 border-t border-black/10" />
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
              {dictionary.auth.email}
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[#3a3048]/55 focus:border-dusty-gold/55"
              placeholder={dictionary.auth.emailPlaceholder}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
              {dictionary.auth.password}
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[#3a3048]/55 focus:border-dusty-gold/55"
              placeholder={dictionary.auth.passwordPlaceholder}
            />
          </label>

          {message ? (
            <p className="border-l border-dusty-gold/45 bg-white/55 py-2 pl-3 pr-2 text-sm leading-6 text-[#3a3048]">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full border-t border-dusty-gold/20 pt-4 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold transition hover:opacity-70 disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? dictionary.auth.processing : mode === "sign-up" ? dictionary.auth.signUp : dictionary.auth.signIn}
          </button>
        </form>

        <div className="mt-5 flex justify-center gap-4 border-t border-black/10 pt-4 text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
          <a href="/privacidad" className="transition hover:text-dusty-gold">{dictionary.legal.privacy}</a>
          <a href="/terminos" className="transition hover:text-dusty-gold">{dictionary.legal.terms}</a>
        </div>
      </div>
    </div>
  );
}
