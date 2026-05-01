"use client";

import { localeOptions, type Dictionary, type Locale } from "@/lib/i18n";

type LanguageSelectorProps = {
  dictionary: Dictionary;
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguageSelector({
  dictionary,
  locale,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-[#fffaf0]/86 px-2 py-2 shadow-[0_10px_28px_rgba(30,26,46,0.12)] backdrop-blur-md">
      <span className="px-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#1e1a2e]">
        {dictionary.common.languageLabel}
      </span>
      <div className="flex items-center gap-1">
        {localeOptions.map((option) => {
          const isActive = option === locale;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={isActive}
              className={[
                "rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[0.2em] transition",
                isActive
                  ? "border border-[#1e1a2e]/25 bg-white text-[#1e1a2e] shadow-[0_6px_14px_rgba(30,26,46,0.14)]"
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
