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
          ? "border border-white/14 bg-white/8 shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
          : "border border-black/15 bg-[#fffaf0]/86 shadow-[0_10px_28px_rgba(30,26,46,0.12)]",
      ].join(" ")}
    >
      <span
        className={[
          "hidden px-2 text-[12px] font-semibold uppercase tracking-[0.24em] min-[520px]:inline",
          night ? "text-[#fffaf0]/72" : "text-[#1e1a2e]",
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
                    ? "border border-[#d7bd6a]/36 bg-[#fffaf0] text-[#1e1a2e] shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
                    : "border border-[#1e1a2e]/25 bg-white text-[#1e1a2e] shadow-[0_6px_14px_rgba(30,26,46,0.14)]"
                  : night
                    ? "border border-transparent text-[#fffaf0]/78 hover:bg-white/10 hover:text-[#d7bd6a]"
                    : "border border-transparent text-[#3a3048] hover:bg-black/[0.05] hover:text-[#1e1a2e]",
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
