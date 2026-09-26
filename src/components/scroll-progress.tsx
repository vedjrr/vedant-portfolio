"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin green bar across the top that fills as the page scrolls. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-[#0e4429] via-[#26a641] to-[#39d353] shadow-[0_0_10px_#39d353]"
    />
  );
}
