"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";

import { ClawdSprite } from "@/components/clawd-sprite";
import { haptic, useSound } from "@/hooks/use-sound";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
].join();
const WALKERS = 14;

type Walker = { id: number; height: number; walk: number; delay: number; bottom: number };
type Parade = { id: number; walkers: Walker[]; ends: number };

function newParade(id: number): Parade {
  // Roughly single file: similar pace, evenly spaced starts, a little jitter.
  const walkers = Array.from({ length: WALKERS }, (_, i) => ({
    id: i,
    height: 14 + Math.round(Math.random() * 14),
    walk: 6 + Math.random() * 1.2,
    delay: i * 0.4 + Math.random() * 0.15,
    bottom: 6 + Math.round(Math.random() * 16),
  }));
  const ends = Math.max(...walkers.map((w) => w.walk + w.delay));
  return { id, walkers, ends };
}

// Logged once per page load, for whoever opens the console.
let greeted = false;

/** ↑ ↑ ↓ ↓ ← → ← → B A sends a parade of Clawds across the screen. */
export function ClawdParade() {
  const [parade, setParade] = useState<Parade | null>(null);
  const reduceMotion = useReducedMotion();
  const click = useSound("/audio/click.wav");

  useEffect(() => {
    if (!greeted) {
      greeted = true;
      console.log(
        "%c ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝\n%cPsst. Try ↑ ↑ ↓ ↓ ← → ← → B A on the page.",
        "color:#d97757;font-size:16px;line-height:1.1",
        "color:inherit;font-family:ui-monospace,monospace",
      );
    }

    const keys: string[] = [];
    const start = () => {
      setParade((p) => newParade((p?.id ?? 0) + 1));
      click({ volume: 0.4 });
      haptic(30);
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      keys.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if (keys.length > 10) keys.shift();
      if (keys.join() === KONAMI) {
        keys.length = 0;
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("portfolio:clawd-parade", start);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portfolio:clawd-parade", start);
    };
  }, [click]);

  useEffect(() => {
    if (!parade) return;
    const ms = (reduceMotion ? 3 : parade.ends + 0.5) * 1000;
    const timer = window.setTimeout(() => setParade(null), ms);
    return () => window.clearTimeout(timer);
  }, [parade, reduceMotion]);

  return (
    <AnimatePresence>
      {parade && (
        <motion.div
          key={parade.id}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        >
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border border-border bg-card/95 px-3 py-1.5 font-pixel text-xs whitespace-nowrap text-muted-foreground shadow-lg backdrop-blur"
          >
            <ClawdSprite className="h-2.5 w-auto" />
            Agent mode: {WALKERS} Clawds deployed
          </motion.p>

          {reduceMotion ? (
            <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
              {parade.walkers.slice(0, 5).map((w) => (
                <ClawdSprite key={w.id} className="h-5 w-auto" />
              ))}
            </div>
          ) : (
            parade.walkers.map((w) => (
              <div
                key={w.id}
                className="clawd-walker absolute left-0"
                style={
                  {
                    bottom: w.bottom,
                    "--walk": `${w.walk}s`,
                    "--delay": `${w.delay}s`,
                  } as CSSProperties
                }
              >
                <div style={{ height: w.height }}>
                  <ClawdSprite walking blinking className="h-full w-auto" />
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
