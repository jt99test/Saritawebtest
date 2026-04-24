"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

type AtmosphericBackgroundProps = {
  variant: "page" | "hero" | "heroGlow" | "divider" | "sectionDivider";
};

const eagleNebulaUrl =
  "https://svs.gsfc.nasa.gov/vis/a000000/a030000/a030960/STScI-H-M16wide_VISNOAO-1920x1080.png";

const starfieldStyle = {
  backgroundImage: [
    "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.82) 0, rgba(255,255,255,0.82) 0.75px, transparent 1.45px)",
    "radial-gradient(circle at 68% 30%, rgba(205,210,226,0.62) 0, rgba(205,210,226,0.62) 0.95px, transparent 1.7px)",
    "radial-gradient(circle at 38% 74%, rgba(255,255,255,0.54) 0, rgba(255,255,255,0.54) 0.8px, transparent 1.5px)",
    "radial-gradient(circle at 86% 64%, rgba(132,145,194,0.32) 0, rgba(132,145,194,0.32) 1px, transparent 1.8px)"
  ].join(","),
  backgroundSize: "260px 260px, 360px 360px, 310px 310px, 420px 420px",
  backgroundPosition: "0 0, 40px 90px, 120px 30px, -40px 140px"
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
          className="pointer-events-none absolute inset-[-6%] bg-cover bg-center opacity-[0.36] saturate-[0.9]"
          style={{ backgroundImage: `url("${eagleNebulaUrl}")` }}
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
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-screen"
          style={starfieldStyle}
          animate={{
            opacity: [0.15, 0.2, 0.16],
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(8,10,16,0.18),transparent_26%),linear-gradient(180deg,rgba(2,3,7,0.46),rgba(2,3,7,0.16)_24%,rgba(2,3,7,0.46)_70%,rgba(2,3,7,0.9)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,transparent_0%,transparent_18%,rgba(2,3,7,0.18)_40%,rgba(2,3,7,0.74)_100%)]"
        />
      </>
    );
  }

  if (variant === "hero") {
    return (
      <>
        <DriftLayer
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.72)_0%,rgba(2,3,7,0.46)_22%,rgba(2,3,7,0.18)_50%,rgba(2,3,7,0.54)_78%,rgba(2,3,7,0.82)_100%),radial-gradient(circle_at_16%_18%,rgba(181,163,110,0.12),transparent_20%),radial-gradient(circle_at_84%_16%,rgba(181,163,110,0.08),transparent_18%),radial-gradient(circle_at_48%_64%,rgba(117,123,166,0.08),transparent_26%)]"
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
          className="absolute left-1/2 top-[66%] h-[28rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.045),transparent_62%)] blur-3xl"
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
          className="absolute left-[11%] top-[18%] h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(181,163,110,0.12),transparent_70%)] blur-3xl"
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
