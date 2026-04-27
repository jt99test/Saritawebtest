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
  const actionClass =
    "mt-6 w-full border-t border-dusty-gold/18 pt-5 text-center text-[11px] uppercase tracking-[0.22em] text-dusty-gold/90 transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60";

  return (
    <section className="mx-auto max-w-[680px] text-center">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        lectura personalizada
      </p>

      <div className="mt-6">
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
            <button type="button" onClick={onGenerate} className={actionClass}>
              Intentar de nuevo
            </button>
          </div>
        ) : prose ? (
          <RenderedReading
            text={prose}
            className="mx-auto mt-2 max-w-none text-left font-serif text-[17px] leading-[1.72] text-white/88"
            paragraphClassName="mb-4"
          />
        ) : (
          <div>
            <p className="font-serif text-[21px] font-normal leading-8 text-white/80">
              Esta luna tiene algo que decirte.
            </p>
            <button type="button" onClick={onGenerate} className={actionClass}>
              Generar lectura
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
