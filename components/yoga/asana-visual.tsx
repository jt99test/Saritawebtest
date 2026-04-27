import type { Asana } from "@/data/sarita/yoga-routines";

type AsanaVisualTone = "fuego" | "tierra" | "agua" | "aire" | "neutral";

type AsanaVisualProps = {
  asana: Pick<Asana, "imagePath" | "nameSanskrit" | "nameSpanish">;
  tone?: AsanaVisualTone;
  className?: string;
};

const TONE_GLOW: Record<AsanaVisualTone, string> = {
  fuego: "rgba(244,114,134,0.08)",
  tierra: "rgba(181,151,115,0.08)",
  agua: "rgba(167,139,250,0.08)",
  aire: "rgba(125,211,252,0.08)",
  neutral: "rgba(167,139,250,0.08)",
};

export function AsanaVisual({
  asana,
  tone = "neutral",
  className = "",
}: AsanaVisualProps) {
  const frameClassName =
    `aspect-[3/4] w-full overflow-hidden rounded-[1.15rem] border border-[#e8c547]/30 bg-[rgba(15,23,42,0.8)] shadow-[0_18px_60px_rgba(0,0,0,0.32)] ${className}`.trim();

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
        backgroundImage: `radial-gradient(circle at 50% 34%, ${TONE_GLOW[tone]}, transparent 46%), linear-gradient(180deg, rgba(15,23,42,0.82), rgba(5,7,13,0.94))`,
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
        <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-200/42">
          Sin foto disponible
        </p>
      </div>
    </div>
  );
}
