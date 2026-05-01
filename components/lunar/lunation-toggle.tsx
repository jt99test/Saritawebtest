"use client";

import Image from "next/image";

import { illustrations } from "@/data/illustrations";
import type { LunationType } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";

type LunationToggleOption = {
  id: LunationType;
  label: string;
  date: string;
};

type LunationToggleProps = {
  options: LunationToggleOption[];
  value: LunationType;
  onChange: (value: LunationType) => void;
  dictionary: Dictionary;
};

export function LunationToggle({
  options,
  value,
  onChange,
  dictionary,
}: LunationToggleProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8 min-[420px]:flex-nowrap md:gap-14 lg:gap-20">
      {options.map((option) => {
        const active = option.id === value;
        const moonSrc =
          option.id === "nueva" ? illustrations.moons.nueva : illustrations.moons.llena;
        const moonName = option.id === "nueva" ? dictionary.lunar.newMoon : dictionary.lunar.fullMoon;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={[
              "group flex w-[min(40vw,140px)] flex-col items-center p-3 text-center outline-none transition duration-[400ms] ease-out focus-visible:ring-2 focus-visible:ring-dusty-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-cosmic-950 lg:w-[180px]",
              active
                ? "scale-100 cursor-pointer bg-dusty-gold/22 text-dusty-gold opacity-100 shadow-[0_2px_12px_rgba(181,163,110,0.18)]"
                : "scale-90 cursor-pointer text-[#3a3048] opacity-70 grayscale saturate-0 hover:scale-95 hover:text-ivory/80 hover:opacity-80 hover:grayscale-0 hover:saturate-100",
            ].join(" ")}
          >
            <span
              className={[
                "relative block aspect-square w-full overflow-hidden rounded-full transition duration-[400ms] ease-out",
                active
                  ? "drop-shadow-[0_0_24px_rgba(232,197,71,0.35)] lg:drop-shadow-[0_0_32px_rgba(232,197,71,0.35)]"
                  : "drop-shadow-none group-hover:drop-shadow-[0_0_20px_rgba(232,197,71,0.2)]",
              ].join(" ")}
            >
              <Image
                src={moonSrc}
                alt={dictionary.lunar.moonIllustrationAlt.replace("{moon}", moonName)}
                width={280}
                height={280}
                priority
                className="h-full w-full object-cover"
                sizes="160px"
              />
            </span>
            <span
              className={[
                "mt-4 font-serif text-[20px] font-normal leading-tight transition-colors duration-[400ms] lg:text-[23px]",
                active ? "text-ivory" : "text-[#3a3048] group-hover:text-[#3a3048]",
              ].join(" ")}
            >
              {option.label}
            </span>
            <span
              className={[
                "mt-2 font-serif text-[13px] italic leading-tight transition-colors duration-[400ms]",
                active ? "text-[#5c4a24]" : "text-[#3a3048] group-hover:text-[#5c4a24]",
              ].join(" ")}
            >
              {option.date}
            </span>
          </button>
        );
      })}
    </div>
  );
}
