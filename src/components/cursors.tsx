"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useRealtime } from "@/components/realtime-provider";
import { flagEmoji } from "@/lib/countries";

type Cursor = { x: number; y: number; path: string; color: string; country: string; seen: number };

// About 12 updates a second: smooth with the CSS easing below, and light on the free quota.
const SEND_MS = 80;
const STALE_MS = 15_000;
const MAX_SHOWN = 12;

// Cursors share coordinates relative to <main>, which only lines up across
// screens in the desktop layout, so phones and tablets sit this out.
const DESKTOP = "(pointer: fine) and (min-width: 768px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isDesktop = () => window.matchMedia(DESKTOP).matches;
const serverDesktop = () => false;

// Pixel arrow on an 8 x 13 grid. 1 = outline, 2 = fill in the visitor's colour.
const ARROW = [
  "1.......",
  "11......",
  "121.....",
  "1221....",
  "12221...",
  "122221..",
  "1222221.",
  "12222221",
  "12221111",
  "1211221.",
  "11.1221.",
  "1...1221",
  ".....11.",
];

function PixelArrow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 8 13" className="h-[19.5px] w-3 drop-shadow-sm" shapeRendering="crispEdges">
      {ARROW.flatMap((row, y) =>
        row.split("").map((c, x) =>
          c === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              className={c === "1" ? "fill-foreground" : undefined}
              fill={c === "2" ? color : undefined}
            />
          ),
        ),
      )}
    </svg>
  );
}

/** Other visitors' cursors on the same page, each tagged with their country's flag. */
export function Cursors() {
  const { presence, selfId, send, subscribe } = useRealtime();
  const pathname = usePathname();
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop);
  const sharing = desktop && Boolean(presence?.cursors);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type !== "cursors") return;
        setCursors((prev) => {
          const next = { ...prev };
          const now = Date.now();
          for (const [id, x, y, path, color, country] of msg.moves) {
            if (x === null || y === null) delete next[id];
            else next[id] = { x, y, path, color, country, seen: now };
          }
          return next;
        });
      }),
    [subscribe],
  );

  // Drop cursors that stopped moving, e.g. a visitor whose tab went to sleep.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const fresh = Object.entries(prev).filter(([, c]) => now - c.seen < STALE_MS);
        return fresh.length === Object.keys(prev).length ? prev : Object.fromEntries(fresh);
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!sharing || !main) return;

    let pointer: { x: number; y: number } | null = null;
    let last = 0;
    let timer: number | undefined;

    const flush = () => {
      timer = undefined;
      if (!pointer) return;
      const rect = main.getBoundingClientRect();
      last = Date.now();
      send({ t: "c", x: Math.round(pointer.x - rect.left), y: Math.round(pointer.y - rect.top), p: pathname });
    };
    const queue = () => {
      timer ??= window.setTimeout(flush, Math.max(0, SEND_MS - (Date.now() - last)));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      queue();
    };
    // Scrolling moves the cursor over the page even when the mouse stays still.
    const onScroll = () => pointer && queue();
    const hide = () => {
      pointer = null;
      window.clearTimeout(timer);
      timer = undefined;
      send({ t: "c", x: null, y: null, p: pathname });
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseout", onOut);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseout", onOut);
      hide();
    };
  }, [sharing, pathname, send]);

  if (!desktop) return null;
  const shown = Object.entries(cursors)
    .filter(([id, c]) => id !== selfId && c.path === pathname)
    .slice(-MAX_SHOWN);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[45]">
      {shown.map(([id, c]) => (
        <div
          key={id}
          className="absolute top-0 left-0 transition-transform duration-100 ease-linear will-change-transform"
          style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
        >
          <PixelArrow color={c.color} />
          <span
            className="absolute top-4 left-3 rounded-sm px-1 py-0.5 text-[11px] leading-none shadow-sm"
            style={{ background: c.color }}
          >
            {flagEmoji(c.country)}
          </span>
        </div>
      ))}
    </div>
  );
}
