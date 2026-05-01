"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { sendPasswordResetAction, deleteAccountAction } from "@/app/cuenta/actions";
import type { Dictionary } from "@/lib/i18n";

type AccountSettingsProps = {
  dictionary: Dictionary;
  email: string;
  confirmWord: string;
};

export function AccountSettings({ dictionary, email, confirmWord }: AccountSettingsProps) {
  const [passwordSent, setPasswordSent] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [pending, startTransition] = useTransition();

  function sendPasswordReset() {
    startTransition(async () => {
      const result = await sendPasswordResetAction();
      if (result.ok) {
        setPasswordSent(true);
      }
    });
  }

  function deleteAccount() {
    startTransition(async () => {
      await deleteAccountAction(confirmValue, confirmWord);
    });
  }

  return (
    <>
      <section className="border-y border-black/10 py-7">
        <h2 className="font-serif text-3xl text-ivory">{dictionary.account.email}</h2>
        <p className="mt-3 text-sm text-[#3a3048]">{email}</p>
        <button
          type="button"
          onClick={sendPasswordReset}
          disabled={pending}
          className="mt-5 border border-black/10 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:border-black/15 hover:text-ivory disabled:opacity-50"
        >
          {dictionary.account.changePassword}
        </button>
        {passwordSent ? (
          <p className="mt-3 text-sm text-[#6f613a]">{dictionary.account.passwordSent}</p>
        ) : null}
      </section>

      <section className="border border-amber-300/24 bg-amber-300/[0.06] p-6">
        <h2 className="font-serif text-3xl text-ivory">{dictionary.account.dangerZone}</h2>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mt-5 border border-amber-300/30 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-300/10"
        >
          {dictionary.account.deleteAccount}
        </button>
      </section>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 backdrop-blur-[10px]">
          <div className="w-full max-w-md border border-black/10 bg-cosmic-950 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.58)]">
            <h2 className="font-serif text-3xl text-ivory">{dictionary.account.deleteConfirmTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-[#3a3048]">{dictionary.account.deleteConfirmBody}</p>
            <input
              value={confirmValue}
              onChange={(event) => setConfirmValue(event.target.value)}
              placeholder={dictionary.account.deleteConfirmPlaceholder}
              className="mt-5 w-full border border-black/15 bg-cosmic-900 px-4 py-4 text-sm text-ivory outline-none transition placeholder:text-muted-ivory hover:border-black/25 focus:border-amber-300/45"
            />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 border border-black/10 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:text-ivory"
              >
                {dictionary.common.close}
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={pending || confirmValue !== confirmWord}
                className="flex-1 border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-300/14 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {dictionary.account.deleteButton}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
