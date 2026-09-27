"use client";

import { Eye } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { counters } from "@/data/site";
import { counterUrl, hitCounter } from "@/lib/counter";

const SESSION_KEY = "va:visited";

/** Real visit count that ticks up live as other people arrive. */
export function VisitorCounter() {
  const [loaded, setLoaded] = useState(false);
  const [arrived, setArrived] = useState(0);
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toLocaleString("en-US"));
  const last = useRef<number | null>(null);

  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage can be blocked; count the visit anyway.
    }

    const show = (count: number) => {
      const previous = last.current;
      if (previous !== null && count <= previous) return;
      last.current = count;
      setLoaded(true);
      if (previous === null) {
        animate(value, count, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
      } else {
        animate(value, count, { duration: 0.5, ease: "easeOut" });
        setArrived((n) => n + 1);
      }
    };

    // Abacus pushes the new total over SSE whenever anyone visits.
    let stream: EventSource | null = null;
    let stopped = false;
    const open = () => {
      if (stream || stopped || document.hidden) return;
      stream = new EventSource(counterUrl("stream", counters.visits));
      stream.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { value?: number };
          if (typeof data.value === "number") show(data.value);
        } catch {}
      };
    };
    const close = () => {
      stream?.close();
      stream = null;
    };
    const onVisibility = () => (document.hidden ? close() : open());

    const controller = new AbortController();
    const counting = counted ? Promise.resolve(null) : hitCounter(counters.visits, controller.signal);
    void counting.then((count) => {
      if (count !== null) {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        show(count);
      }
      open();
    });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      controller.abort();
      close();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [value]);

  return (
    <span
      className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums"
      title={`Real visits since ${counters.since}, updated live`}
    >
      <Eye className="size-3.5" />
      {loaded ? (
        <motion.span
          key={arrived}
          initial={arrived ? { color: "var(--brand)" } : false}
          animate={{ color: "var(--muted-foreground)" }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          {text}
        </motion.span>
      ) : (
        <span className="opacity-50">—</span>
      )}
    </span>
  );
}
