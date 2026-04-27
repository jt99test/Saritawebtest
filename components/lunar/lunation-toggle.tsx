"use client";

import Image from "next/image";

import { illustrations } from "@/data/illustrations";
import type { LunationType } from "@/lib/lunar-report";

type LunationToggleOption = {
  id: LunationType;
  label: string;
  date: string;
};

type LunationToggleProps = {
  options: LunationToggleOption[];
  value: LunationType;
  onChange: (value: LunationType) => void;
};

export function LunationToggle({
  options,
  value,
  onChange,
}: LunationToggleProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-10 min-[420px]:flex-nowrap md:gap-20 lg:gap-[120px]">
      {options.map((option) => {
        const active = option.id === value;
        const moonSrc =
          option.id === "nueva" ? illustrations.moons.nueva : illustrations.moons.llena;
        const moonName = option.id === "nueva" ? "Luna Nueva" : "Luna Llena";

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={[
              "group flex w-[min(42vw,160px)] flex-col items-center p-0 text-center outline-none transition duration-[400ms] ease-out focus-visible:ring-2 focus-visible:ring-dusty-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-cosmic-950 lg:w-[220px]",
              active
                ? "scale-100 cursor-pointer opacity-100"
                : "scale-90 cursor-pointer opacity-40 grayscale saturate-0 hover:scale-95 hover:opacity-70 hover:grayscale-0 hover:saturate-100",
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
                alt={`Ilustración de ${moonName}`}
                width={280}
                height={280}
                priority
                className="h-full w-full object-cover"
                sizes="160px"
              />
            </span>
            <span
              className={[
                "mt-6 font-serif text-[22px] font-normal leading-tight transition-colors duration-[400ms] lg:text-[26px]",
                active ? "text-white" : "text-white/40 group-hover:text-white/62",
              ].join(" ")}
            >
              {option.label}
            </span>
            <span
              className={[
                "mt-2 font-serif text-[13px] italic leading-tight transition-colors duration-[400ms]",
                active ? "text-dusty-gold/70" : "text-white/40 group-hover:text-dusty-gold/55",
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
