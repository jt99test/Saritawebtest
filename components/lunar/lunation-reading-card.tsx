"use client";

import { motion } from "motion/react";

import { RenderedReading } from "@/components/ui/rendered-reading";

type LunationReadingCardProps = {
  prose: string;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
};

export function LunationReadingCard({
  prose,
  loading,
  error,
  onGenerate,
}: LunationReadingCardProps) {
  return (
    <section className="mx-auto max-w-[680px] text-center">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        lectura personalizada
      </p>

      <div className="mt-10">
        {loading ? (
          <motion.div
            className="font-serif text-[15px] italic text-dusty-gold/70"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            Generando lectura
          </motion.div>
        ) : null}

        {error ? (
          <div className="mt-4 space-y-4">
            <p className="font-serif text-[17px] leading-8 text-white/68">{error}</p>
            <button
              type="button"
              onClick={onGenerate}
              className="border border-dusty-gold/40 px-8 py-3.5 font-serif text-sm text-dusty-gold/90 transition hover:bg-dusty-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : prose ? (
          <RenderedReading
            text={prose}
            className="mx-auto mt-2 max-w-none text-left font-serif text-[19px] leading-[1.8] text-white/88 lg:text-[20px] lg:leading-[1.85]"
            paragraphClassName="mb-6"
          />
        ) : (
          <div>
            <p className="font-serif text-[22px] font-normal leading-8 text-white/80">
              Esta luna tiene algo que decirte.
            </p>
            <button
              type="button"
              onClick={onGenerate}
              className="mt-8 border border-dusty-gold/40 bg-transparent px-8 py-3.5 font-serif text-sm text-dusty-gold/90 transition hover:bg-dusty-gold/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60"
            >
              Generar lectura
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
