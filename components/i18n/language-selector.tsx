"use client";

import { localeOptions, type Dictionary, type Locale } from "@/lib/i18n";

type LanguageSelectorProps = {
  dictionary: Dictionary;
  locale: Locale;
  onChange: (locale: Locale) => void;
  tone?: "light" | "night";
};

export function LanguageSelector({
  dictionary,
  locale,
  onChange,
  tone = "light",
}: LanguageSelectorProps) {
  const night = tone === "night";

  return (
    <div
      className={[
        "inline-flex min-w-0 shrink items-center gap-1 rounded-full px-1.5 py-1.5 backdrop-blur-md sm:gap-1.5 sm:px-2 sm:py-2",
        night
          ? "border border-[#d7e7ff]/14 bg-[#071437]/70 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
          : "border border-[#d7e7ff]/16 bg-[#071437]/78 shadow-[0_10px_28px_rgba(0,0,0,0.18),0_0_22px_rgba(0,102,255,0.1)]",
      ].join(" ")}
    >
      <span
        className={[
          "hidden px-2 text-[12px] font-semibold uppercase tracking-[0.24em] min-[520px]:inline",
          night ? "text-[#d7e7ff]/72" : "text-[#d7e7ff]/72",
        ].join(" ")}
      >
        {dictionary.common.languageLabel}
      </span>
      <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        {localeOptions.map((option) => {
          const isActive = option === locale;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={isActive}
              className={[
                "rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] transition sm:px-3 sm:text-[12px] sm:tracking-[0.2em]",
                isActive
                  ? night
                    ? "border border-[#f5d782]/42 bg-[#f5d782]/16 text-[#f5d782] shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
                    : "border border-[#f5d782]/42 bg-[#f5d782]/16 text-[#f5d782] shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
                  : night
                    ? "border border-transparent text-[#d7e7ff]/78 hover:bg-[#7cbfff]/10 hover:text-[#f5d782]"
                    : "border border-transparent text-[#d7e7ff]/78 hover:bg-[#7cbfff]/10 hover:text-[#f5d782]",
              ].join(" ")}
            >
              {dictionary.common.languages[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
