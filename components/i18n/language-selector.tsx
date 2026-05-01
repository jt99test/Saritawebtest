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
    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/12 px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <span className="px-2 text-[12px] font-medium uppercase tracking-[0.3em] text-[#3a3048]">
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
                "rounded-full px-3 py-1.5 text-[12px] font-medium tracking-[0.24em] transition",
                isActive
                  ? "bg-white text-cosmic-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                  : "text-[#3a3048] hover:bg-white/7 hover:text-ivory",
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
