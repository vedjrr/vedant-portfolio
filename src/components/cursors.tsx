"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useRealtime } from "@/components/realtime-provider";
import { flagEmoji } from "@/lib/countries";

type Cursor = {
  x: number;
  y: number;
  anchor: string;
  path: string;
  color: string;
  country: string;
  seen: number;
};

// About 12 updates a second: smooth with the CSS easing below, and light on the free quota.
const SEND_MS = 80;
const STALE_MS = 15_000;
const MAX_SHOWN = 12;
// A cursor is pinned to the element under it, at most this deep in <main>:
// page section, row, then the block inside that row.
const ANCHOR_DEPTH = 3;
// Positions inside that element are shared in ten-thousandths of its size.
const SCALE = 10_000;

/**
 * The element under a point, as child indexes from <main> ("2.1.0"). Every
 * screen renders the same elements for a page, so the same path finds the same
 * content on a wide monitor, a half-width window or a phone, however it wraps.
 */
function anchorAt(main: HTMLElement, x: number, y: number) {
  const target = document.elementFromPoint(x, y);
  const chain: Element[] = [];
  if (target && main.contains(target)) {
    for (let el: Element | null = target; el && el !== main; el = el.parentElement) chain.unshift(el);
  }
  let el: Element = main;
  const path: number[] = [];
  for (const child of chain.slice(0, ANCHOR_DEPTH)) {
    const rect = child.getBoundingClientRect();
    if (!rect.width || !rect.height) break;
    path.push([...el.children].indexOf(child));
    el = child;
  }
  return { el, anchor: path.join(".") };
}

/** Finds an anchor from anchorAt, stopping early if this screen is missing part of the path. */
function findAnchor(main: HTMLElement, anchor: string) {
  let el: Element = main;
  for (const i of anchor ? anchor.split(".").map(Number) : []) {
    const next = el.children[i];
    if (!next) break;
    el = next;
  }
  return el;
}

/** Where a cursor sits on this screen, in pixels from the top left of <main>. */
function place(main: HTMLElement, cursor: Cursor) {
  const box = main.getBoundingClientRect();
  const rect = findAnchor(main, cursor.anchor).getBoundingClientRect();
  return {
    x: rect.left - box.left + (cursor.x / SCALE) * rect.width,
    y: rect.top - box.top + (cursor.y / SCALE) * rect.height,
  };
}

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
  const sharing = Boolean(presence?.cursors);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  // Bumped when <main> changes size, so cursors follow content that reflows.
  const [, setLayout] = useState(0);

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type !== "cursors") return;
        setCursors((prev) => {
          const next = { ...prev };
          const now = Date.now();
          for (const [id, x, y, path, color, country, anchor] of msg.moves) {
            if (x === null || y === null) delete next[id];
            else next[id] = { x, y, anchor, path, color, country, seen: now };
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
    if (!main) return;
    const observer = new ResizeObserver(() => setLayout((n) => n + 1));
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  // Only a real mouse sends a cursor. Touch screens still see everyone else's.
  useEffect(() => {
    const main = document.querySelector("main");
    if (!sharing || !main) return;

    let pointer: { x: number; y: number } | null = null;
    let last = 0;
    let timer: number | undefined;

    const flush = () => {
      timer = undefined;
      if (!pointer) return;
      const { el, anchor } = anchorAt(main, pointer.x, pointer.y);
      const rect = el.getBoundingClientRect();
      last = Date.now();
      send({
        t: "c",
        x: Math.round(((pointer.x - rect.left) / rect.width) * SCALE),
        y: Math.round(((pointer.y - rect.top) / rect.height) * SCALE),
        a: anchor,
        p: pathname,
      });
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

  const shown = Object.entries(cursors)
    .filter(([id, c]) => id !== selfId && c.path === pathname)
    .slice(-MAX_SHOWN);
  // Cursors only ever arrive in the browser, so this never runs on the server.
  const main = shown.length ? document.querySelector("main") : null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[45]">
      {main &&
        shown.map(([id, c]) => {
          const { x, y } = place(main, c);
          return (
            <div
              key={id}
              className="absolute top-0 left-0 transition-transform duration-100 ease-linear will-change-transform"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <PixelArrow color={c.color} />
              <span
                className="absolute top-4 left-3 rounded-sm px-1 py-0.5 text-[11px] leading-none shadow-sm"
                style={{ background: c.color }}
              >
                {flagEmoji(c.country)}
              </span>
            </div>
          );
        })}
    </div>
  );
}
