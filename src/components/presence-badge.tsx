"use client";

import { AnimatePresence, motion } from "motion/react";

import { useRealtime } from "@/components/realtime-provider";
import { countryName, flagEmoji } from "@/lib/countries";

/** "3 here" with the flags of where those visitors are, updated live. */
export function PresenceBadge() {
  const { presence } = useRealtime();
  if (!presence) return null;

  const { online, countries } = presence;
  const title =
    online === 1
      ? "Just you here right now"
      : `${online} here now: ${countries.map(([c, n]) => `${countryName(c)} ${n}`).join(", ")}`;

  return (
    <span
      className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums"
      title={title}
    >
      <span aria-hidden="true" className="halo size-1.5 shrink-0 rounded-full bg-brand" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={online}
          aria-hidden="true"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          {online}
        </motion.span>
      </AnimatePresence>
      <span aria-hidden="true" className="hidden sm:inline">
        here
      </span>
      <span className="hidden gap-0.5 sm:flex" aria-hidden="true">
        {countries.slice(0, 3).map(([code]) => (
          <span key={code}>{flagEmoji(code)}</span>
        ))}
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
