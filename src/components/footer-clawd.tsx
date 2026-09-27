"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CLAWD_ORANGE, ClawdSprite } from "@/components/clawd-sprite";
import { counters } from "@/data/site";
import { hitCounter } from "@/lib/counter";
import { haptic, useSound } from "@/hooks/use-sound";

const AWAKE_MS = 6000;
const BUBBLE_MS = 2400;
// Abacus allows 30 requests per 10 seconds per visitor, so pets are sent at most
// every 400 ms. Faster pets still wake Clawd but don't count.
const HIT_GAP_MS = 400;
const COMBO = 10;
const COMBO_MS = 4000;
const CENTER = { x: 0, y: 0 };

/** Clawd naps in the footer. Pet it to wake it, and it watches the pointer until it dozes off again. */
export function FooterClawd() {
  const [awake, setAwake] = useState(false);
  const [peek, setPeek] = useState(false);
  const [look, setLook] = useState(CENTER);
  const [pets, setPets] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [bubble, setBubble] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sleepTimer = useRef<number | undefined>(undefined);
  const bubbleTimer = useRef<number | undefined>(undefined);
  const lastHit = useRef(0);
  const combo = useRef<number[]>([]);
  const reduceMotion = useReducedMotion();
  const [body, animateBody] = useAnimate<HTMLSpanElement>();
  const play = useSound("/audio/click.wav");

  // Awake Clawd follows the pointer with its eyes.
  useEffect(() => {
    if (!awake) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = button.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const reach = Math.min(distance / 160, 1);
        setLook({ x: (dx / distance) * reach * 0.35, y: (dy / distance) * reach * 0.3 });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [awake]);

  useEffect(
    () => () => {
      window.clearTimeout(sleepTimer.current);
      window.clearTimeout(bubbleTimer.current);
    },
    [],
  );

  const pet = useCallback(() => {
    const now = Date.now();
    window.clearTimeout(sleepTimer.current);
    setAwake(true);
    setPets((n) => n + 1);
    if (!reduceMotion) {
      void animateBody(
        body.current,
        { y: [0, -5, 0], scaleY: [1, 1.06, 1] },
        { duration: 0.34, ease: "easeOut" },
      );
    }
    play({ volume: 0.3 });
    haptic(15);
    sleepTimer.current = window.setTimeout(() => {
      setAwake(false);
      setLook(CENTER);
    }, AWAKE_MS);

    window.clearTimeout(bubbleTimer.current);
    setBubble(true);
    bubbleTimer.current = window.setTimeout(() => setBubble(false), BUBBLE_MS);

    if (now - lastHit.current >= HIT_GAP_MS) {
      lastHit.current = now;
      void hitCounter(counters.pets).then((value) => {
        if (value !== null) setTotal((t) => Math.max(t ?? 0, value));
      });
    }

    // Ten quick pets start the parade, the touch-friendly way in.
    combo.current = [...combo.current.filter((t) => now - t < COMBO_MS), now];
    if (combo.current.length >= COMBO) {
      combo.current = [];
      window.dispatchEvent(new CustomEvent("portfolio:clawd-parade"));
    }
  }, [animateBody, body, play, reduceMotion]);

  const eyes = awake ? "open" : peek ? "half" : "closed";

  return (
    <div className="relative">
      <AnimatePresence>
        {bubble && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute -top-7 right-0 rounded-sm border border-border bg-card px-1.5 py-0.5 font-pixel text-[10px] whitespace-nowrap text-muted-foreground shadow-sm"
          >
            <span style={{ color: CLAWD_ORANGE }}>♥</span>{" "}
            {total === null ? "purr" : `${total.toLocaleString("en-US")} pets`}
          </motion.span>
        )}
      </AnimatePresence>

      {!awake && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 left-3 flex font-pixel text-[9px] text-muted-foreground"
        >
          <span className="clawd-z absolute">z</span>
          <span className="clawd-z absolute left-1.5">z</span>
          <span className="clawd-z absolute left-3">z</span>
        </div>
      )}

      <button
        ref={button}
        type="button"
        onClick={pet}
        onPointerEnter={() => setPeek(true)}
        onPointerLeave={() => setPeek(false)}
        aria-label="Pet Clawd"
        title="Pet Clawd"
        className="block cursor-pointer rounded-sm outline-offset-4"
      >
        <span ref={body} className="block origin-bottom">
          <ClawdSprite
            eyes={eyes}
            look={awake ? look : CENTER}
            blinking={awake}
            className={awake ? "h-7 w-auto" : "clawd-sleep h-7 w-auto"}
          />
        </span>
        {pets > 0 && (
          <span
            key={pets}
            aria-hidden="true"
            className="clawd-heart pointer-events-none absolute -top-1 left-1/2 font-pixel text-[10px]"
            style={{ color: CLAWD_ORANGE }}
          >
            ♥
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {awake && total !== null ? `Clawd has been petted ${total} times.` : ""}
      </span>
    </div>
  );
}
