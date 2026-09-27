"use client";

import { Clock } from "lucide-react";
import { useSyncExternalStore } from "react";

import { profile } from "@/data/site";

const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: profile.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const offset = new Intl.DateTimeFormat("en-GB", {
  timeZone: profile.timeZone,
  timeZoneName: "shortOffset",
});

const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
// Whole seconds, so the snapshot only changes once per tick.
const now = () => Math.floor(Date.now() / 1000);
// "Maynooth, Ireland" reads country first: "Ireland, Maynooth".
const place = profile.location.split(", ").reverse().join(", ");
// The server can't know the visitor's clock; render a placeholder until hydrated.
const serverNow = () => null;

/** Live local time where I am, ticking every second. */
export function LocalClock() {
  const seconds = useSyncExternalStore(subscribe, now, serverNow);
  const date = seconds === null ? null : new Date(seconds * 1000);
  const zone = date && offset.formatToParts(date).find((p) => p.type === "timeZoneName")?.value;

  return (
    <span
      className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums"
      title={`Local time in ${place}${zone ? ` (${zone})` : ""}`}
    >
      <Clock className="size-3.5" />
      <span className="hidden sm:inline">{place}</span>
      {date ? (
        <time dateTime={date.toISOString()}>{time.format(date)}</time>
      ) : (
        <span className="opacity-50">--:--:--</span>
      )}
    </span>
  );
}
