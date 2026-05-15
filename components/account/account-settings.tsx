"use client";

import { useState, useTransition } from "react";

import { sendPasswordResetAction, deleteAccountAction } from "@/app/cuenta/actions";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { showNotice } from "@/components/ui/notice-provider";
import type { Dictionary } from "@/lib/i18n";

type AccountSettingsProps = {
  dictionary: Dictionary;
  email: string;
  confirmWord: string;
};

export function AccountSettings({ dictionary, email, confirmWord }: AccountSettingsProps) {
  const locale = useStoredLocale();
  const [passwordSent, setPasswordSent] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteExpanded, setDeleteExpanded] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [pending, startTransition] = useTransition();

  function sendPasswordReset() {
    startTransition(async () => {
      showNotice({ message: dictionary.auth.sendingResetLink, tone: "info" });
      const result = await sendPasswordResetAction(locale);
      if (result.ok) {
        setPasswordSent(true);
        showNotice({ message: dictionary.account.passwordSent, tone: "success" });
      } else {
        showNotice({ message: dictionary.auth.resetPasswordError, tone: "error" });
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
          <p className="mt-3 text-sm text-[#5c4a24]">{dictionary.account.passwordSent}</p>
        ) : null}
      </section>

      <section className="border-t border-black/10 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-ivory">{dictionary.account.accountDeletion}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#3a3048]">
              {dictionary.account.accountDeletionBody}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteExpanded((current) => !current)}
            className="self-start border border-black/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:border-black/18 hover:text-ivory"
            aria-expanded={deleteExpanded}
          >
            {dictionary.account.deleteAccount} {deleteExpanded ? "-" : "+"}
          </button>
        </div>

        {deleteExpanded ? (
          <div className="mt-5 border border-[#f5d782]/28 bg-[#f5d782]/8 p-5 shadow-[0_0_28px_rgba(245,215,130,0.08)]">
            <p className="text-sm leading-6 text-[#3a3048]">{dictionary.account.deleteWarning}</p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-4 border border-[#f5d782]/45 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f5d782] transition hover:bg-[#f5d782]/12"
            >
              {dictionary.account.deleteAccount}
            </button>
          </div>
        ) : null}
      </section>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 backdrop-blur-[10px]">
          <div className="w-full max-w-md border border-[#f5d782]/28 bg-[#071437]/96 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_34px_rgba(0,102,255,0.14)]">
            <h2 className="font-serif text-3xl text-ivory">{dictionary.account.deleteConfirmTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-[#3a3048]">{dictionary.account.deleteConfirmBody}</p>
            <input
              value={confirmValue}
              onChange={(event) => setConfirmValue(event.target.value)}
              placeholder={dictionary.account.deleteConfirmPlaceholder}
              className="mt-5 w-full border border-[#d7e7ff]/16 bg-[#030814]/62 px-4 py-4 text-sm text-[#fffaf0] outline-none transition placeholder:text-[#d7e7ff]/45 hover:border-[#d7e7ff]/24 focus:border-[#f5d782]/50"
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
                className="flex-1 border border-[#f5d782]/36 bg-[#f5d782]/12 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f5d782] transition hover:bg-[#f5d782]/18 disabled:cursor-not-allowed disabled:opacity-40"
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
