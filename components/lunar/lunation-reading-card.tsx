"use client";

import { motion } from "motion/react";

import { PrimaryButton } from "@/components/ui/primary-button";
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
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">
        lectura personalizada
      </p>

      <div className="mt-6">
        {loading ? (
          <motion.div
            className="mx-auto inline-flex min-w-56 items-center justify-center border border-dusty-gold/24 bg-dusty-gold/[0.055] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/86 shadow-[0_16px_44px_rgba(0,0,0,0.22)]"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            Generando lectura
          </motion.div>
        ) : error ? (
          <div className="mt-4 space-y-4">
            <p className="font-serif text-[17px] leading-8 text-white/68">{error}</p>
            <PrimaryButton
              type="button"
              onClick={onGenerate}
              variant="ghostGold"
              className="mt-2 min-w-52 px-6 py-3 text-[0.72rem] uppercase tracking-[0.2em]"
            >
              Intentar de nuevo
            </PrimaryButton>
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
            <PrimaryButton
              type="button"
              onClick={onGenerate}
              className="mt-7 min-w-56 px-7 py-3 text-[0.74rem] uppercase tracking-[0.2em]"
            >
              Generar lectura
            </PrimaryButton>
          </div>
        )}
      </div>
    </section>
  );
}
