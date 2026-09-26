"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

/** Scrambles the text into random glyphs, then resolves it left to right. */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | undefined>(undefined);

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
    const id = window.setTimeout(run, 300);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(frame.current ?? 0);
    };
  }, [run]);

  return (
    <span className={className} onPointerEnter={run} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
