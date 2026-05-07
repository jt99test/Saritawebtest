"use client";

import { useMemo, useState, type FormEvent } from "react";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage(dictionary.auth.passwordMismatch);
      return;
    }

    setPending(true);
    showNotice({ message: dictionary.auth.updatingPassword, tone: "info" });
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setMessage(error.message);
      showNotice({ message: dictionary.auth.passwordUpdateError, tone: "error" });
      return;
    }

    showNotice({ message: dictionary.auth.passwordUpdated, tone: "success" });
    router.replace("/cuenta");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md border border-black/10 bg-white/80 p-6 shadow-[0_18px_54px_rgba(30,26,46,0.08)]">
      <h1 className="font-serif text-4xl text-ivory">{dictionary.auth.resetPasswordTitle}</h1>
      <p className="mt-4 text-sm leading-7 text-[#3a3048]">{dictionary.auth.resetPasswordBody}</p>

      <label className="mt-6 block">
        <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
          {dictionary.auth.newPassword}
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

      <label className="mt-4 block">
        <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
          {dictionary.auth.confirmPassword}
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full border border-black/15 bg-white px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[#3a3048]/55 focus:border-dusty-gold/55"
          placeholder={dictionary.auth.passwordPlaceholder}
        />
      </label>

      {message ? (
        <p className="mt-4 border-l border-dusty-gold/45 bg-white/55 py-2 pl-3 pr-2 text-sm leading-6 text-[#3a3048]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full border-t border-dusty-gold/20 pt-4 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold transition hover:opacity-70 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? dictionary.auth.processing : dictionary.auth.updatePassword}
      </button>
    </form>
  );
}
