import type { Asana } from "@/data/sarita/yoga-routines";

type AsanaVisualTone = "fuego" | "tierra" | "agua" | "aire" | "neutral";

type AsanaVisualProps = {
  asana: Pick<Asana, "imagePath" | "nameSanskrit" | "nameSpanish">;
  tone?: AsanaVisualTone;
  missingImageLabel?: string;
  className?: string;
};

const TONE_GLOW: Record<AsanaVisualTone, string> = {
  fuego: "rgba(245,215,130,0.18)",
  tierra: "rgba(215,231,255,0.12)",
  agua: "rgba(0,102,255,0.16)",
  aire: "rgba(124,191,255,0.14)",
  neutral: "rgba(245,215,130,0.1)",
};

export function AsanaVisual({
  asana,
  tone = "neutral",
  missingImageLabel = "Sin foto disponible",
  className = "",
}: AsanaVisualProps) {
  const frameClassName =
    `aspect-[3/4] w-full overflow-hidden rounded-[1.15rem] border border-[#d7e7ff]/14 bg-[#071437] shadow-[0_0_28px_rgba(0,102,255,0.08),inset_0_1px_0_rgba(255,250,240,0.12)] ${className}`.trim();
  const imageAlt = asana.nameSanskrit === asana.nameSpanish
    ? asana.nameSpanish
    : `${asana.nameSanskrit} · ${asana.nameSpanish}`;

  if (asana.imagePath) {
    return (
      <div className={`relative ${frameClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asana.imagePath}
          alt={imageAlt}
          className="h-full w-full object-contain object-center opacity-[0.88] brightness-[1.22] contrast-[0.88] saturate-[0.78] sepia-[0.18]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[#7cbfff]/10 mix-blend-screen"
          style={{ backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 48%)` }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${frameClassName} items-center justify-center px-6 text-center`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 46%), linear-gradient(180deg, rgba(7,20,55,0.92), rgba(3,8,20,0.72))`,
      }}
    >
      <div className="flex max-w-[15rem] flex-col items-center">
        <div className="relative h-12 w-12 text-dusty-gold/72" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border border-current/35" />
          <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current/45" />
          <span className="absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-current/20" />
          <span className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-current/20" />
        </div>
        <p className="mt-5 font-serif text-2xl leading-tight text-ivory/88">
          {asana.nameSpanish}
        </p>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/66">
          {missingImageLabel}
        </p>
      </div>
    </div>
  );
}
