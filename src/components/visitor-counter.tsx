"use client";

import { Eye } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

const SESSION_KEY = "va:visited";

export function VisitorCounter() {
  const [loaded, setLoaded] = useState(false);
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage can be blocked; count the visit anyway.
    }

    const controller = new AbortController();
    fetch("/api/visitors", {
      method: counted ? "GET" : "POST",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (typeof data?.count !== "number") return;
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        setLoaded(true);
        animate(value, data.count, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [value]);

  return (
    <span
      className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums"
      title="Visitors"
    >
      <Eye className="size-3.5" />
      {loaded ? <motion.span>{text}</motion.span> : <span className="opacity-50">—</span>}
    </span>
  );
}
