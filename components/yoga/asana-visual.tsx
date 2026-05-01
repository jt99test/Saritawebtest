import type { Asana } from "@/data/sarita/yoga-routines";

type AsanaVisualTone = "fuego" | "tierra" | "agua" | "aire" | "neutral";

type AsanaVisualProps = {
  asana: Pick<Asana, "imagePath" | "nameSanskrit" | "nameSpanish">;
  tone?: AsanaVisualTone;
  className?: string;
};

const TONE_GLOW: Record<AsanaVisualTone, string> = {
  fuego: "rgba(181,163,110,0.06)",
  tierra: "rgba(181,163,110,0.05)",
  agua: "rgba(236,232,223,0.05)",
  aire: "rgba(236,232,223,0.05)",
  neutral: "rgba(236,232,223,0.05)",
};

export function AsanaVisual({
  asana,
  tone = "neutral",
  className = "",
}: AsanaVisualProps) {
  const frameClassName =
    `aspect-[3/4] w-full overflow-hidden rounded-[1.15rem] border border-[rgba(236,232,223,0.09)] bg-[rgba(255,255,255,0.025)] shadow-none ${className}`.trim();

  if (asana.imagePath) {
    return (
      <div className={frameClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asana.imagePath}
          alt={`${asana.nameSanskrit} · ${asana.nameSpanish}`}
          className="h-full w-full object-contain object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${frameClassName} items-center justify-center px-6 text-center`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 46%), linear-gradient(180deg, rgba(10,14,22,0.88), rgba(0,0,0,0.04))`,
      }}
    >
      <div className="flex max-w-[15rem] flex-col items-center">
        <div className="relative h-12 w-12 text-[#e8c547]/72" aria-hidden="true">
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
