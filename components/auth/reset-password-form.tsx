"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { showNotice } from "@/components/ui/notice-provider";
import { dictionaries } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsFreshLink, setNeedsFreshLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "invalid") {
      setNeedsFreshLink(true);
      setMessage(dictionary.auth.resetPasswordSessionMissing);
      return;
    }

    const code = params.get("code");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const resetType = hashParams.get("type");

    if (!code && (!accessToken || !refreshToken || resetType !== "recovery")) {
      return;
    }

    let cancelled = false;
    setPending(true);

    const sessionPromise = code
      ? supabase.auth.exchangeCodeForSession(code)
      : supabase.auth.setSession({
          access_token: accessToken!,
          refresh_token: refreshToken!,
        });

    void sessionPromise.then(({ error }) => {
      if (cancelled) {
        return;
      }

      setPending(false);

      if (error) {
        setNeedsFreshLink(true);
        setMessage(dictionary.auth.resetPasswordSessionMissing);
        showNotice({ message: dictionary.auth.resetPasswordSessionMissing, tone: "error" });
        return;
      }

      window.history.replaceState(null, "", window.location.pathname);
    });

    return () => {
      cancelled = true;
    };
  }, [dictionary.auth.resetPasswordSessionMissing, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setNeedsFreshLink(false);

    if (password !== confirmPassword) {
      setMessage(dictionary.auth.passwordMismatch);
      return;
    }

    setPending(true);
    showNotice({ message: dictionary.auth.updatingPassword, tone: "info" });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setPending(false);
      setNeedsFreshLink(true);
      setMessage(dictionary.auth.resetPasswordSessionMissing);
      showNotice({ message: dictionary.auth.resetPasswordSessionMissing, tone: "error" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      const sessionMissing = error.message.toLowerCase().includes("auth session missing");
      const errorMessage = sessionMissing ? dictionary.auth.resetPasswordSessionMissing : dictionary.auth.passwordUpdateError;
      setNeedsFreshLink(sessionMissing);
      setMessage(errorMessage);
      showNotice({ message: errorMessage, tone: "error" });
      return;
    }

    showNotice({ message: dictionary.auth.passwordUpdated, tone: "success" });
    router.replace("/cuenta");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md border border-[#f5d782]/24 bg-[#071437]/92 p-6 text-[#d7e7ff] shadow-[0_28px_90px_rgba(0,0,0,0.35),0_0_34px_rgba(0,102,255,0.12)] backdrop-blur-md"
    >
      <h1 className="font-serif text-4xl leading-tight text-[#fffaf0]">{dictionary.auth.resetPasswordTitle}</h1>
      <p className="mt-4 text-sm leading-7 text-[#d7e7ff]/78">{dictionary.auth.resetPasswordBody}</p>

      <label className="mt-6 block">
        <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#d7e7ff]/72">
          {dictionary.auth.newPassword}
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border border-[#d7e7ff]/18 bg-[#030814]/72 px-4 py-3 text-sm text-[#fffaf0] outline-none transition placeholder:text-[#d7e7ff]/45 focus:border-[#f5d782]/55"
          placeholder={dictionary.auth.passwordPlaceholder}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#d7e7ff]/72">
          {dictionary.auth.confirmPassword}
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full border border-[#d7e7ff]/18 bg-[#030814]/72 px-4 py-3 text-sm text-[#fffaf0] outline-none transition placeholder:text-[#d7e7ff]/45 focus:border-[#f5d782]/55"
          placeholder={dictionary.auth.passwordPlaceholder}
        />
      </label>

      {message ? (
        <p className="mt-4 border-l border-[#f5d782]/45 bg-[#f5d782]/8 py-2 pl-3 pr-2 text-sm leading-6 text-[#d7e7ff]">
          {message}
        </p>
      ) : null}

      {needsFreshLink ? (
        <a
          href="/?auth=required"
          className="mt-4 block border border-[#f5d782]/28 px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f5d782] transition hover:border-[#f5d782]/45 hover:text-[#ffe7a3]"
        >
          {dictionary.auth.resetPasswordRequestNewLink}
        </a>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full border-t border-[#f5d782]/20 pt-4 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f5d782] transition hover:text-[#ffe7a3] disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? dictionary.auth.processing : dictionary.auth.updatePassword}
      </button>
    </form>
  );
}
