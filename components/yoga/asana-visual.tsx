import type { Asana } from "@/data/sarita/yoga-routines";

type AsanaVisualTone = "fuego" | "tierra" | "agua" | "aire" | "neutral";

type AsanaVisualProps = {
  asana: Pick<Asana, "imagePath" | "nameSanskrit" | "nameSpanish">;
  tone?: AsanaVisualTone;
  className?: string;
};

const TONE_GLOW: Record<AsanaVisualTone, string> = {
  fuego: "rgba(182,106,76,0.12)",
  tierra: "rgba(111,127,89,0.1)",
  agua: "rgba(95,131,144,0.1)",
  aire: "rgba(121,113,167,0.1)",
  neutral: "rgba(111,90,42,0.08)",
};

export function AsanaVisual({
  asana,
  tone = "neutral",
  className = "",
}: AsanaVisualProps) {
  const frameClassName =
    `aspect-[3/4] w-full overflow-hidden rounded-[1.15rem] border border-black/10 bg-[#f5f0e6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.44)] ${className}`.trim();

  if (asana.imagePath) {
    return (
      <div className={`relative ${frameClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asana.imagePath}
          alt={`${asana.nameSanskrit} · ${asana.nameSpanish}`}
          className="h-full w-full object-contain object-center opacity-[0.88] brightness-[1.22] contrast-[0.88] saturate-[0.78] sepia-[0.18]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[#f5f0e6]/20 mix-blend-screen"
          style={{ backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 48%)` }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${frameClassName} items-center justify-center px-6 text-center`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 46%), linear-gradient(180deg, rgba(255,250,240,0.92), rgba(245,240,230,0.62))`,
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
          {asana.nameSanskrit}
        </p>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048]">
          Sin foto disponible
        </p>
      </div>
    </div>
  );
}
