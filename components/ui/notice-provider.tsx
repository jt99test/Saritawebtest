"use client";

import { useEffect, useState } from "react";

type NoticeTone = "info" | "success" | "error";

type NoticePayload = {
  message: string;
  tone?: NoticeTone;
};

type Notice = Required<NoticePayload> & {
  id: number;
};

const NOTICE_EVENT = "sarita:notice";

export function showNotice(payload: NoticePayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NoticePayload>(NOTICE_EVENT, { detail: payload }));
}

export function NoticeProvider() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    function handleNotice(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail as NoticePayload : null;
      if (!detail?.message) return;
      setNotice({
        id: Date.now(),
        message: detail.message,
        tone: detail.tone ?? "info",
      });
    }

    window.addEventListener(NOTICE_EVENT, handleNotice);
    return () => window.removeEventListener(NOTICE_EVENT, handleNotice);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) {
    return null;
  }

  const toneClass =
    notice.tone === "success"
      ? "border-[#7cbfff]/40 bg-[#071437]/95 text-[#d7e7ff]"
      : notice.tone === "error"
        ? "border-[#f5d782]/44 bg-[#071437]/95 text-[#fffaf0]"
        : "border-[#f5d782]/35 bg-[#071437]/95 text-[#d7e7ff]";

  return (
    <div className="fixed left-1/2 top-4 z-[1200] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0">
      <div
        key={notice.id}
        role="status"
        aria-live="polite"
        className={`border px-4 py-3 text-sm leading-6 shadow-[0_18px_54px_rgba(0,0,0,0.28),0_0_28px_rgba(0,102,255,0.12)] backdrop-blur-md ${toneClass}`}
      >
        {notice.message}
      </div>
    </div>
  );
}
