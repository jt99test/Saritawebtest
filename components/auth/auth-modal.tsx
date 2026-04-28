"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "sign-up" | "sign-in";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setPending(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-4 backdrop-blur-[10px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={closeModal}
      />

      <div className="relative w-full max-w-[430px] border border-[rgba(236,232,223,0.12)] bg-[rgba(8,11,18,0.98)] px-6 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.58)]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 text-[18px] leading-none text-ivory/42 transition hover:text-ivory"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="mb-6 flex border-b border-white/10">
          {[
            { id: "sign-up", label: "Crear cuenta" },
            { id: "sign-in", label: "Iniciar sesión" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id as AuthMode);
                setMessage(null);
              }}
              className={[
                "border-b px-4 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                mode === tab.id
                  ? "border-dusty-gold text-dusty-gold"
                  : "border-transparent text-ivory/42 hover:text-ivory/72",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/45">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-white/12 bg-white/[0.025] px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-ivory/28 focus:border-dusty-gold/45"
              placeholder="tu@email.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/45">
              Contraseña
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-white/12 bg-white/[0.025] px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-ivory/28 focus:border-dusty-gold/45"
              placeholder="mínimo 6 caracteres"
            />
          </label>

          {message ? (
            <p className="border-l border-dusty-gold/35 pl-3 text-sm leading-6 text-ivory/62">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full border-t border-dusty-gold/20 pt-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-gold transition hover:opacity-70 disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? "Procesando" : mode === "sign-up" ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={pending}
          className="mt-5 w-full border border-white/12 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/72 transition hover:border-dusty-gold/35 hover:text-ivory disabled:cursor-wait disabled:opacity-50"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
