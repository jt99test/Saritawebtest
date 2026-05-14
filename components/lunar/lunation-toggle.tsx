"use client";

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

function swipeHintLabel(dictionary: Dictionary) {
  if (dictionary.lunar.fullMoon === "Full Moon") return "Swipe to see more";
  if (dictionary.lunar.fullMoon === "Luna Piena") return "Scorri per vedere di piu";
  return "Desliza para ver mas";
}

function LunarMedallion({ isNewMoon, active, label }: { isNewMoon: boolean; active: boolean; label: string }) {
  const ticks = Array.from({ length: 24 }, (_, index) => index);

  return (
    <span
      className={[
        "relative block aspect-square w-full overflow-visible rounded-full transition duration-[400ms] ease-out",
        active
          ? "drop-shadow-[0_0_24px_rgba(232,197,71,0.35)] lg:drop-shadow-[0_0_32px_rgba(232,197,71,0.35)]"
          : "drop-shadow-none group-hover:drop-shadow-[0_0_20px_rgba(232,197,71,0.18)]",
      ].join(" ")}
      aria-label={label}
      role="img"
    >
      <span className="absolute inset-0 rounded-full border border-dusty-gold/35 bg-[radial-gradient(circle_at_34%_28%,rgba(255,250,240,0.18),rgba(232,197,71,0.08)_36%,rgba(10,12,20,0.58)_68%,rgba(10,12,20,0.9))] shadow-[inset_0_0_30px_rgba(255,250,240,0.08),0_18px_44px_rgba(0,0,0,0.18)]" />
      <span className="absolute inset-[9%] rounded-full border border-white/10" />
      <span className="absolute inset-[16%] rounded-full border border-dusty-gold/18" />
      <span className="absolute inset-[23%] rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,250,240,0.94),rgba(216,194,122,0.8)_38%,rgba(92,74,36,0.55)_64%,rgba(15,14,24,0.96)_100%)] shadow-[inset_-12px_-16px_24px_rgba(10,12,20,0.38),inset_7px_7px_16px_rgba(255,255,255,0.14)]">
        {isNewMoon ? (
          <span className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_42%_36%,rgba(45,43,58,0.96),rgba(10,12,20,0.98)_64%,rgba(0,0,0,1))] shadow-[inset_9px_8px_24px_rgba(255,250,240,0.05),0_0_18px_rgba(216,194,122,0.1)]" />
        ) : (
          <span className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_34%_26%,rgba(255,255,255,0.98),rgba(245,240,230,0.94)_45%,rgba(204,190,156,0.82)_72%,rgba(95,75,31,0.56))] shadow-[inset_-10px_-12px_18px_rgba(92,74,36,0.18),0_0_18px_rgba(255,250,240,0.24)]" />
        )}
        <span className="absolute left-[28%] top-[31%] h-[9%] w-[9%] rounded-full bg-black/12 blur-[0.5px]" />
        <span className="absolute left-[55%] top-[42%] h-[6%] w-[6%] rounded-full bg-black/10 blur-[0.5px]" />
        <span className="absolute left-[39%] top-[60%] h-[12%] w-[18%] rounded-full bg-black/8 blur-[1px]" />
      </span>
      <span className="absolute inset-0 animate-[spin_36s_linear_infinite] rounded-full">
        {ticks.map((tick) => (
          <span
            key={tick}
            className={[
              "absolute left-1/2 top-1/2 h-[1px] origin-left rounded-full bg-dusty-gold/40",
              tick % 6 === 0 ? "w-[10%]" : tick % 3 === 0 ? "w-[7%]" : "w-[4%]",
            ].join(" ")}
            style={{ transform: `rotate(${tick * 15}deg) translateX(43%)` }}
          />
        ))}
      </span>
      <span className="absolute inset-[2%] rounded-full border border-transparent bg-[conic-gradient(from_80deg,transparent,rgba(232,197,71,0.28),transparent_28%,transparent_64%,rgba(255,250,240,0.18),transparent)] opacity-70" />
    </span>
  );
}

export function LunationToggle({
  options,
  value,
  onChange,
  dictionary,
}: LunationToggleProps) {
  const hasExtraLunations = options.length > 2;

  return (
    <>
      {hasExtraLunations ? (
        <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a7a4e] md:hidden">
          {swipeHintLabel(dictionary)} {"\u2192"}
        </p>
      ) : null}
      <div className={hasExtraLunations
        ? "flex snap-x snap-mandatory overflow-x-auto gap-3 px-5 pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:flex-wrap md:snap-none md:overflow-x-visible md:items-start md:justify-center md:gap-8 lg:gap-12"
        : "flex flex-wrap items-start justify-center gap-8 min-[420px]:flex-nowrap md:gap-14 lg:gap-20"}
      >
        {options.map((option) => {
          const active = option.id === value;
          const isNewMoon = option.id.startsWith("nueva");
          const moonName = isNewMoon ? dictionary.lunar.newMoon : dictionary.lunar.fullMoon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={[
                hasExtraLunations
                  ? "group flex w-[min(38vw,148px)] flex-shrink-0 snap-center flex-col items-center p-2 text-center outline-none transition duration-[400ms] ease-out focus-visible:ring-2 focus-visible:ring-dusty-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-cosmic-950 md:flex-shrink md:w-[126px] lg:w-[150px]"
                  : "group flex w-[min(40vw,140px)] flex-col items-center p-3 text-center outline-none transition duration-[400ms] ease-out focus-visible:ring-2 focus-visible:ring-dusty-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-cosmic-950 lg:w-[180px]",
                active
                  ? "scale-100 cursor-pointer border border-dusty-gold/48 bg-dusty-gold/22 text-dusty-gold opacity-100 shadow-[0_8px_22px_rgba(181,163,110,0.22)]"
                  : "scale-90 cursor-pointer text-[#3a3048] opacity-70 grayscale saturate-0 hover:scale-95 hover:text-ivory/80 hover:opacity-80 hover:grayscale-0 hover:saturate-100",
              ].join(" ")}
            >
              <LunarMedallion
                isNewMoon={isNewMoon}
                active={active}
                label={dictionary.lunar.moonIllustrationAlt.replace("{moon}", moonName)}
              />
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
    </>
  );
}
