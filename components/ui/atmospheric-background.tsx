"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

type AtmosphericBackgroundProps = {
  variant: "page" | "hero" | "heroGlow" | "divider" | "sectionDivider";
};

const nebulaTextureUrl = "/images/decorative/bg-nebula-texture.png";

const starfieldStyle = {
  backgroundImage: [
    "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.82) 0, rgba(255,255,255,0.82) 0.75px, transparent 1.45px)",
    "radial-gradient(circle at 68% 30%, rgba(205,210,226,0.62) 0, rgba(205,210,226,0.62) 0.95px, transparent 1.7px)",
    "radial-gradient(circle at 38% 74%, rgba(255,255,255,0.54) 0, rgba(255,255,255,0.54) 0.8px, transparent 1.5px)",
    "radial-gradient(circle at 86% 64%, rgba(132,145,194,0.32) 0, rgba(132,145,194,0.32) 1px, transparent 1.8px)"
  ].join(","),
  backgroundSize: "380px 380px, 520px 520px, 460px 460px, 620px 620px",
  backgroundPosition: "0 0, 70px 120px, 160px 40px, -60px 180px"
} as const;

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
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#020307_0%,#05070d_100%)]"
        />
        <DriftLayer
          className="pointer-events-none absolute inset-[-6%] bg-cover bg-center opacity-[0.16] saturate-[0.72] contrast-[0.9]"
          style={{ backgroundImage: `url("${nebulaTextureUrl}")` }}
          animate={{
            scale: [1.03, 1.08, 1.04, 1.03],
            x: [0, -18, 14, 0],
            y: [0, -12, 10, 0]
          }}
          transition={{
            duration: 56,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
        <DriftLayer
          className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
          style={starfieldStyle}
          animate={{
            opacity: [0.18, 0.24, 0.2],
            x: [0, 12, -8, 0],
            y: [0, -8, 6, 0]
          }}
          transition={{
            duration: 38,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
        />
        <DriftLayer
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 72% 24%, rgba(255,246,210,0.9) 0, rgba(255,246,210,0.72) 1.2px, rgba(181,163,110,0.28) 2.4px, transparent 5px)",
          }}
          animate={{
            opacity: [0.22, 0.5, 0.28],
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 9,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,3,7,0.72),rgba(5,7,13,0.38)_32%,rgba(5,7,13,0.78)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.88),rgba(2,3,7,0.12)_48%,rgba(2,3,7,0.88))]"
        />
      </>
    );
  }

  if (variant === "hero") {
    return (
      <>
        <DriftLayer
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.82)_0%,rgba(2,3,7,0.42)_28%,rgba(2,3,7,0.24)_50%,rgba(2,3,7,0.58)_78%,rgba(2,3,7,0.9)_100%),linear-gradient(180deg,rgba(181,163,110,0.08),transparent_34%,rgba(181,163,110,0.06)_100%)]"
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
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/54 to-transparent"
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(5,7,13,0.78)_40%,#05070d)]"
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
