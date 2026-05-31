"use client";

type BiWheelAspectToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  locale: string;
};

function aspectToggleCopy(locale: string) {
  if (locale === "en") {
    return {
      label: "Aspect lines",
      on: "On",
      off: "Off",
      hint: "Show or hide the lines connecting both wheels.",
    };
  }

  if (locale === "it") {
    return {
      label: "Linee aspetti",
      on: "Attive",
      off: "Spente",
      hint: "Mostra o nasconde le linee che collegano le due ruote.",
    };
  }

  return {
    label: "Lineas de aspectos",
    on: "Activas",
    off: "Ocultas",
    hint: "Muestra u oculta las lineas que conectan ambas ruedas.",
  };
}

export function BiWheelAspectToggle({ enabled, onChange, locale }: BiWheelAspectToggleProps) {
  const copy = aspectToggleCopy(locale);

  return (
    <div className="mx-auto mb-5 flex max-w-3xl flex-col items-center gap-2 text-center">
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={[
          "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md transition",
          enabled
            ? "border-[#f5d782]/70 bg-[#f5d782]/18 text-[#fffaf0] shadow-[0_0_26px_rgba(245,215,130,0.18)]"
            : "border-[#d7e7ff]/28 bg-[#061331]/72 text-[#d7e7ff]/86 shadow-[0_0_22px_rgba(0,102,255,0.08)] hover:border-[#f5d782]/44 hover:text-[#fffaf0]",
        ].join(" ")}
        aria-pressed={enabled}
      >
        <span
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full border p-0.5 transition",
            enabled
              ? "border-[#f5d782]/62 bg-[#f5d782]/24"
              : "border-[#d7e7ff]/30 bg-[#d7e7ff]/10",
          ].join(" ")}
          aria-hidden="true"
        >
          <span
            className={[
              "h-3.5 w-3.5 rounded-full transition-transform",
              enabled ? "translate-x-4 bg-[#f5d782] shadow-[0_0_12px_rgba(245,215,130,0.55)]" : "translate-x-0 bg-[#d7e7ff]/58",
            ].join(" ")}
          />
        </span>
        <span>{copy.label}</span>
        <span
          className={[
            "rounded-full px-2 py-1 text-[9px] tracking-[0.14em]",
            enabled ? "bg-[#f5d782]/18 text-[#f5d782]" : "bg-[#d7e7ff]/10 text-[#d7e7ff]/72",
          ].join(" ")}
        >
          {enabled ? copy.on : copy.off}
        </span>
      </button>
      <p className="max-w-sm text-[11px] leading-5 text-[#d7e7ff]/62">
        {copy.hint}
      </p>
    </div>
  );
}
