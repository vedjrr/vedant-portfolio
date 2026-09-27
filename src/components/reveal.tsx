"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.2, 0.8, 0.2, 1] as const;

/** Fades a block up into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals its StaggerItem children one after another when it scrolls into view. */
export function Stagger({
  children,
  gap = 0.03,
  className,
}: {
  children: ReactNode;
  gap?: number;
  className?: string;
}) {
  return (
    <motion.ul
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ staggerChildren: gap }}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 6, scale: 0.94, filter: "blur(3px)" },
        shown: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
      }}
      transition={{ duration: 0.35, ease }}
    >
      {children}
    </motion.li>
  );
}

/** Resolves a sentence word by word out of a blur. */
export function BlurWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: 0.06 }}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block whitespace-pre"
          variants={{
            hidden: { opacity: 0, y: 4, filter: "blur(8px)" },
            shown: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.5, ease }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </motion.span>
      ))}
    </motion.span>
  );
}
