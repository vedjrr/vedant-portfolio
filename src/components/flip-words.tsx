"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Cycles through words; each letter flips in on its own delay. */
export function FlipWords({ words, interval = 3200 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  const word = words[index];

  return (
    <span className="relative inline-flex h-6 items-center overflow-hidden [perspective:400px]">
      <span key={word} aria-label={word} className="inline-flex whitespace-pre">
        {word.split("").map((char, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="inline-block origin-bottom"
            initial={{ opacity: 0, rotateX: 90, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, rotateX: 0, y: 0, filter: "blur(0px)" }}
            transition={{ delay: i * 0.025, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
