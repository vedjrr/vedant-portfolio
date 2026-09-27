"use client";

import { useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

/**
 * Scrambles the text into random glyphs, then resolves it left to right.
 * Plays on mount, or with `playOn="view"` the first time it scrolls into view.
 * Hovering replays it.
 */
export function ScrambleText({
  text,
  className,
  playOn = "mount",
}: {
  text: string;
  className?: string;
  playOn?: "mount" | "view";
}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const ready = playOn === "mount" || inView;

  const run = useCallback(() => {
    cancelAnimationFrame(frame.current ?? 0);
    const start = performance.now();
    const duration = 650;
    const tickFn = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * text.length);
      setDisplay(
        text
          .split("")
          .map((c, i) =>
            c === " " || i < settled ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (progress < 1) frame.current = requestAnimationFrame(tickFn);
    };
    frame.current = requestAnimationFrame(tickFn);
  }, [text]);

  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(run, playOn === "mount" ? 300 : 0);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(frame.current ?? 0);
    };
  }, [ready, run, playOn]);

  return (
    <span ref={ref} className={className} onPointerEnter={run}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
