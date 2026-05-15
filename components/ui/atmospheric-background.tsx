"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

type AtmosphericBackgroundProps = {
  variant: "page" | "hero" | "heroGlow" | "divider" | "sectionDivider";
};

function DriftLayer({
  className,
  animate,
  transition,
  style
}: {
  className: string;
  animate?: Record<string, string[] | number[]>;
  transition?: Record<string, unknown>;
  style?: CSSProperties;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion || !animate) {
    return <div aria-hidden="true" className={className} style={style} />;
  }

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      style={style}
      animate={animate}
      transition={transition}
    />
  );
}

export function AtmosphericBackground({ variant }: AtmosphericBackgroundProps) {
  if (variant === "page") {
    return (
      <>
        <div
          aria-hidden="true"
          className="sarita-page-atmosphere-layer pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="sarita-page-color-wash pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="sarita-page-orbit-field pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span />
          <span />
          <span />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,19,0.34),rgba(16,13,34,0.18)_24rem,rgba(255,250,240,0)_62rem)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(30,26,46,0.045),rgba(0,0,0,0)_48%,rgba(111,90,42,0.045))]"
        />
      </>
    );
  }

  if (variant === "hero") {
    return (
      <>
        <DriftLayer
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.02)_28%,rgba(0,0,0,0.01)_50%,rgba(0,0,0,0.03)_78%,rgba(0,0,0,0.05)_100%),linear-gradient(180deg,rgba(181,163,110,0.08),transparent_34%,rgba(181,163,110,0.06)_100%)]"
          animate={{
            opacity: [0.94, 1, 0.96],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 34,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/[0.04] to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-cosmic-950 via-cosmic-950/42 to-transparent"
        />
      </>
    );
  }

  if (variant === "heroGlow") {
    return (
      <>
        <DriftLayer
          className="absolute inset-x-0 top-[58%] h-px bg-gradient-to-r from-transparent via-white/14 to-transparent blur-[1px]"
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.78, 0.96, 0.82]
          }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
        <DriftLayer
          className="absolute inset-y-0 left-[10%] w-px bg-gradient-to-b from-transparent via-dusty-gold/10 to-transparent blur-[1px]"
          animate={{
            x: [0, 12, -8, 0],
            y: [0, -10, 6, 0]
          }}
          transition={{
            duration: 40,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
      </>
    );
  }

  if (variant === "divider") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.04)_40%,#f5f0e6)]"
      >
        <div className="absolute inset-x-[10%] top-8 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-[18%] top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent"
    />
  );
}
