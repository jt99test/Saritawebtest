"use client";

import type { HTMLMotionProps } from "motion/react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  distance?: number;
  mode?: "inView" | "immediate";
} & HTMLMotionProps<"div">;

export function Reveal({
  children,
  delay = 0,
  className,
  distance = 24,
  mode = "inView",
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const target =
    reduceMotion
      ? undefined
      : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? undefined
          : { opacity: 0, y: distance, scale: 0.985, filter: "blur(10px)" }
      }
      animate={mode === "immediate" ? target : undefined}
      whileInView={mode === "inView" ? target : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
