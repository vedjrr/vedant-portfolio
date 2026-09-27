"use client";

import { Eraser, Hand, PenLine, Type, Undo2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

import { ClawdSprite } from "@/components/clawd-sprite";
import { useRealtime } from "@/components/realtime-provider";
import {
  BOARD_MAX_HEIGHT,
  BOARD_WIDTH,
  INKS,
  MAX_POINTS,
  MAX_TEXT,
  addMark,
  eraseMark,
  listMarks,
  type Draft,
  type Mark,
} from "@/lib/guestbook";
import { cn } from "@/lib/utils";

type Tool = "pen" | "text" | "hand" | "erase";

const PEN_WIDTH = 3;
const FONT_SIZE = 22;
const GRID = 20;
// The board starts this tall and always keeps this much room below the lowest mark.
const MIN_HEIGHT = 1200;
const ROOM_BELOW = 500;
// A stroke longer than this many raw points is saved and a new one carries on.
const RAW_LIMIT = 4000;

// Remembered in this browser only.
const KEY_STORE = "board-key"; // random key that proves which marks are yours
const MINE_STORE = "board-mine"; // ids of your marks, newest last, for undo
const ADMIN_STORE = "board-admin"; // the site owner's ADMIN_SECRET, for the eraser

// Storage can throw or be missing (private windows, blocked site data), so
// everything falls back to memory for this visit.
const memory = new Map<string, string>();
const storeListeners = new Set<() => void>();

function readStored(name: string) {
  try {
    const value = localStorage.getItem(name);
    if (value !== null) return value;
  } catch {}
  return memory.get(name) ?? null;
}

function writeStored(name: string, value: string | null) {
  if (value === null) memory.delete(name);
  else memory.set(name, value);
  try {
    if (value === null) localStorage.removeItem(name);
    else localStorage.setItem(name, value);
  } catch {}
  storeListeners.forEach((listener) => listener());
}

function subscribeStored(onChange: () => void) {
  storeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    storeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function visitorKey() {
  let key = readStored(KEY_STORE);
  if (!key) {
    key = crypto.randomUUID().replaceAll("-", "");
    writeStored(KEY_STORE, key);
  }
  return key;
}

function readMine(raw: string): string[] {
  try {
    const ids: unknown = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

const saveMine = (ids: string[]) => writeStored(MINE_STORE, JSON.stringify(ids.slice(-200)));

const subscribeCoarse = (onChange: () => void) => {
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** A smooth SVG path through the points, curving through each midpoint. */
function pathData(p: number[]) {
  if (p.length < 4) return "";
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    d += `Q${p[i]} ${p[i + 1]} ${(p[i] + p[i + 2]) / 2} ${(p[i + 1] + p[i + 3]) / 2}`;
  }
  return `${d}L${p[p.length - 2]} ${p[p.length - 1]}`;
}

/** Drops points that barely change the line's shape (Ramer-Douglas-Peucker). */
function simplify(p: number[], tolerance: number) {
  const n = p.length / 2;
  if (n < 3) return p;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay, bx, by] = [p[a * 2], p[a * 2 + 1], p[b * 2], p[b * 2 + 1]];
    const length = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let farthest = tolerance;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = [p[i * 2], p[i * 2 + 1]];
      const distance = length
        ? Math.abs((by - ay) * (x - ax) - (bx - ax) * (y - ay)) / length
        : Math.hypot(x - ax, y - ay);
      if (distance > farthest) [far, farthest] = [i, distance];
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return p.filter((_, i) => keep[i >> 1]);
}

/** The points of a finished stroke, small enough for the Worker to accept. */
function finishPoints(raw: number[]) {
  let points = simplify(raw, 0.6);
  for (let tolerance = 1.2; points.length > MAX_POINTS * 2; tolerance *= 2) {
    points = simplify(raw, tolerance);
  }
  points = points.map(Math.round);
  // A tap is a dot: a line from a point to itself, drawn with round caps.
  return points.length === 2 ? [...points, ...points] : points;
}

const lowest = (m: Mark) =>
  m.kind === "pen" ? Math.max(...m.points.filter((_, i) => i % 2)) : m.y + FONT_SIZE;

let measure: CanvasRenderingContext2D | null = null;
function textWidth(text: string, fontFamily: string) {
  measure ??= document.createElement("canvas").getContext("2d");
  if (!measure) return 0;
  measure.font = `${FONT_SIZE}px ${fontFamily}`;
  return measure.measureText(text).width;
}

/** The shared whiteboard. Draw or type anywhere; everyone on the page sees it live. */
export function GuestbookBoard({ initial }: { initial: Mark[] }) {
  const { presence, subscribe } = useRealtime();
  const [marks, setMarks] = useState(initial);
  const [picked, setPicked] = useState<Tool | null>(null);
  const [color, setColor] = useState(0);
  const [note, setNote] = useState<{ x: number; y: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const coarse = useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  const mineRaw = useSyncExternalStore(
    subscribeStored,
    () => readStored(MINE_STORE) ?? "[]",
    () => "[]",
  );
  const admin = useSyncExternalStore(subscribeStored, () => readStored(ADMIN_STORE), () => null);
  const mine = useMemo(() => readMine(mineRaw), [mineRaw]);

  // Touch screens start on the hand so the page still scrolls.
  const tool: Tool = picked === "erase" && !admin ? "pen" : (picked ?? (coarse ? "hand" : "pen"));

  const svg = useRef<SVGSVGElement>(null);
  const live = useRef<SVGPathElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const stroke = useRef<{ pointer: number; points: number[] } | null>(null);
  const noteRef = useRef(note);
  const localId = useRef(0);
  const errorTimer = useRef<number | undefined>(undefined);
  const mountedAt = useRef(0);
  const dots = useId();

  const height = useMemo(() => {
    const bottom = marks.reduce((max, m) => Math.max(max, lowest(m)), 0);
    return Math.min(BOARD_MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil((bottom + ROOM_BELOW) / 100) * 100));
  }, [marks]);

  const flash = useCallback((message: string) => {
    setError(message);
    window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), 4000);
  }, []);

  useEffect(() => {
    mountedAt.current = Date.now();
    // The site owner opens /guestbook#admin=<ADMIN_SECRET> once to get the eraser.
    const match = window.location.hash.match(/^#admin=(.+)$/);
    if (match) {
      writeStored(ADMIN_STORE, decodeURIComponent(match[1]));
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type === "board-add") {
          setMarks((ms) => (ms.some((m) => m.id === msg.mark.id) ? ms : [...ms, msg.mark]));
        }
        if (msg.type === "board-remove") {
          setMarks((ms) => ms.filter((m) => !msg.ids.includes(m.id)));
        }
        // Back after a dropped connection: catch up on anything drawn meanwhile.
        if (msg.type === "welcome" && Date.now() - mountedAt.current > 5000) {
          void listMarks().then((fresh) => {
            if (fresh) setMarks((ms) => [...fresh, ...ms.filter((m) => m.id.startsWith("local-"))]);
          });
        }
      }),
    [subscribe],
  );

  // Shows a mark straight away, then swaps in the saved one (or takes it back).
  const commit = useCallback(
    async (draft: Draft) => {
      const temp = `local-${++localId.current}`;
      setMarks((ms) => [...ms, { ...draft, id: temp }]);
      const result = await addMark(draft, visitorKey());
      setMarks((ms) => {
        if (!result.ok || ms.some((m) => m.id === result.mark.id)) return ms.filter((m) => m.id !== temp);
        return ms.map((m) => (m.id === temp ? result.mark : m));
      });
      if (result.ok) saveMine([...readMine(readStored(MINE_STORE) ?? "[]"), result.mark.id]);
      else flash(result.error);
    },
    [flash],
  );

  const lastMine = useMemo(
    () => mine.findLast((id) => marks.some((m) => m.id === id)),
    [mine, marks],
  );

  const undo = useCallback(async () => {
    const mark = marks.find((m) => m.id === lastMine);
    if (!mark) return;
    saveMine(mine.filter((id) => id !== mark.id));
    setMarks((ms) => ms.filter((m) => m.id !== mark.id));
    const { status } = await eraseMark(mark.id, { key: visitorKey() });
    // 404: it was already gone.
    if (status !== 200 && status !== 404) {
      setMarks((ms) => [...ms, mark]);
      saveMine([...readMine(readStored(MINE_STORE) ?? "[]"), mark.id]);
      flash("Couldn't undo that. Try again.");
    }
  }, [marks, lastMine, mine, flash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        void undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const rect = svg.current!.getBoundingClientRect();
    const scale = BOARD_WIDTH / rect.width;
    const clamp = (n: number, max: number) => Math.round(Math.max(0, Math.min(max, n)) * 10) / 10;
    return [clamp((e.clientX - rect.left) * scale, BOARD_WIDTH), clamp((e.clientY - rect.top) * scale, height)];
  };

  const drawLive = (points: number[]) => live.current?.setAttribute("d", pathData(points.length === 2 ? [...points, ...points] : points));

  const endStroke = (save: boolean) => {
    const current = stroke.current;
    stroke.current = null;
    drawLive([]);
    if (save && current) void commit({ kind: "pen", color, points: finishPoints(current.points) });
  };

  const onPointerDown = async (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (tool === "pen") {
      e.currentTarget.setPointerCapture(e.pointerId);
      stroke.current = { pointer: e.pointerId, points: toBoard(e) };
      drawLive(stroke.current.points);
    }
    if (tool === "erase" && admin) {
      const id = (e.target as Element).closest("[data-mark]")?.getAttribute("data-mark");
      if (!id || id.startsWith("local-")) return;
      const { status } = await eraseMark(id, { admin, everything: e.shiftKey });
      if (status === 401) {
        writeStored(ADMIN_STORE, null);
        flash("That admin key is wrong, so the eraser is off.");
      } else if (status !== 200 && status !== 404) {
        flash("Couldn't erase that. Try again.");
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const current = stroke.current;
    if (!current || current.pointer !== e.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const event of events.length ? events : [e.nativeEvent]) {
      const [x, y] = toBoard(event);
      const n = current.points.length;
      if (x !== current.points[n - 2] || y !== current.points[n - 1]) current.points.push(x, y);
    }
    if (current.points.length >= RAW_LIMIT * 2) {
      const [x, y] = current.points.slice(-2);
      endStroke(true);
      stroke.current = { pointer: e.pointerId, points: [x, y] };
    }
    drawLive(stroke.current?.points ?? []);
  };

  const placeNote = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (tool !== "text") return;
    const [x, y] = toBoard(e);
    // Rendered right away so the keyboard opens on phones, which only allow
    // focus inside the tap itself.
    flushSync(() => {
      noteRef.current = { x, y };
      setNote({ x, y });
      setNoteText("");
    });
    input.current?.focus();
  };

  const submitNote = () => {
    const current = noteRef.current;
    noteRef.current = null;
    setNote(null);
    const text = noteText.replace(/\s+/g, " ").trim();
    if (!current || !text) return;
    // Nudge it left so the whole note stays on the board.
    const width = input.current ? textWidth(text, getComputedStyle(input.current).fontFamily) : 0;
    const x = Math.max(0, Math.min(current.x, BOARD_WIDTH - width - 4));
    void commit({ kind: "text", color, x: Math.round(x), y: Math.round(current.y), text });
  };

  const count = marks.length;
  const notes = marks.filter((m) => m.kind === "text");
  const ink = INKS[color].value;

  return (
    <>
      <div className="screen-line-after sticky! top-12 z-30 flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-background/85 px-3 py-2 backdrop-blur-md">
        <div role="group" aria-label="Tool" className="flex items-center gap-0.5">
          <ToolButton label="Pen" active={tool === "pen"} onClick={() => setPicked("pen")}>
            <PenLine />
          </ToolButton>
          <ToolButton label="Text" active={tool === "text"} onClick={() => setPicked("text")}>
            <Type />
          </ToolButton>
          <ToolButton label="Scroll" active={tool === "hand"} onClick={() => setPicked("hand")}>
            <Hand />
          </ToolButton>
          {admin && (
            <ToolButton
              label="Erase (Shift-click erases everything that visitor added)"
              active={tool === "erase"}
              onClick={() => setPicked("erase")}
            >
              <Eraser />
            </ToolButton>
          )}
        </div>

        <div role="radiogroup" aria-label="Colour" className="flex items-center gap-1">
          {INKS.map((option, i) => (
            <button
              key={option.name}
              type="button"
              role="radio"
              aria-checked={color === i}
              aria-label={option.name}
              title={option.name}
              onClick={() => setColor(i)}
              className={cn(
                "grid size-7 place-items-center rounded-md transition-colors hover:bg-accent",
                color === i && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "size-3.5 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                  color === i && "ring-2 ring-foreground/40",
                )}
                style={{ background: option.value }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void undo()}
          disabled={!lastMine}
          title="Undo your last mark (⌘Z)"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Undo2 className="size-3.5" />
          Undo
        </button>

        <div className="ml-auto flex items-center gap-3 font-mono text-xs text-muted-foreground">
          {error ? (
            <span role="alert" className="text-red-500">
              {error}
            </span>
          ) : (
            <span className="tabular-nums">
              {count} {count === 1 ? "mark" : "marks"}
            </span>
          )}
          {presence && (
            <span className="flex items-center gap-1.5" title="New marks appear as they're made">
              <span className="halo size-1.5 rounded-full bg-brand" />
              Live
            </span>
          )}
        </div>
      </div>

      <div
        className="relative select-none"
        style={{ aspectRatio: `${BOARD_WIDTH} / ${height}`, containerType: "inline-size" }}
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${BOARD_WIDTH} ${height}`}
          role="img"
          aria-label={`Guestbook whiteboard with ${count} ${count === 1 ? "mark" : "marks"}`}
          className={cn(
            "absolute inset-0 size-full",
            tool === "pen" && "cursor-crosshair touch-none",
            tool === "text" && "cursor-text",
            tool === "erase" && "cursor-pointer touch-none",
          )}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          onPointerDown={(e) => void onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={() => endStroke(true)}
          onPointerCancel={() => endStroke(false)}
          onClick={placeNote}
        >
          <defs>
            <pattern id={dots} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx={GRID / 2} cy={GRID / 2} r={1} style={{ fill: "var(--pattern-foreground)" }} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${dots})`} />

          {marks.map((m) =>
            m.kind === "pen" ? (
              <path
                key={m.id}
                data-mark={m.id}
                d={pathData(m.points)}
                strokeWidth={PEN_WIDTH}
                style={{ stroke: INKS[m.color]?.value ?? INKS[0].value }}
              />
            ) : (
              <text
                key={m.id}
                data-mark={m.id}
                x={m.x}
                y={m.y}
                fontSize={FONT_SIZE}
                dominantBaseline="middle"
                className="font-mono"
                style={{ fill: INKS[m.color]?.value ?? INKS[0].value }}
              >
                {m.text}
              </text>
            ),
          )}

          {/* Thin strokes are hard to hit, so the eraser gets a wide invisible edge. */}
          {tool === "erase" &&
            marks.map((m) =>
              m.kind === "pen" ? (
                <path
                  key={`hit-${m.id}`}
                  data-mark={m.id}
                  d={pathData(m.points)}
                  stroke="transparent"
                  strokeWidth={16}
                />
              ) : null,
            )}

          <path ref={live} strokeWidth={PEN_WIDTH} style={{ stroke: ink }} />
        </svg>

        {note && (
          <input
            ref={input}
            value={noteText}
            maxLength={MAX_TEXT}
            aria-label="Your note"
            placeholder="Type, then Enter"
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNote();
              if (e.key === "Escape") {
                noteRef.current = null;
                setNote(null);
              }
            }}
            onBlur={submitNote}
            className="absolute -translate-y-1/2 border-b border-dashed border-brand/60 bg-background/70 font-mono outline-none placeholder:text-muted-foreground/60"
            style={{
              left: `${(note.x / BOARD_WIDTH) * 100}%`,
              top: `${(note.y / height) * 100}%`,
              width: `${((BOARD_WIDTH - note.x) / BOARD_WIDTH) * 100}%`,
              fontSize: `${(FONT_SIZE / BOARD_WIDTH) * 100}cqw`,
              color: ink,
            }}
          />
        )}

        {count === 0 && !note && (
          <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-4 text-center">
            <ClawdSprite eyes="closed" className="clawd-sleep h-6 w-auto" />
            <p className="font-mono text-sm text-muted-foreground">
              The board is empty. Be the first to sign it.
            </p>
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <ul className="sr-only" aria-label="Notes on the board">
          {notes.map((m) => (
            <li key={m.id}>{m.text}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}
