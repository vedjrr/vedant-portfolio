"use client";

import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Contribution } from "@/lib/github";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL = 11;
const GAP = 3;

function parse(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function ContributionGraph({ days, total }: { days: Contribution[]; total: number }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ day: Contribution; x: number; y: number } | null>(null);
  const inView = useInView(scroller, { once: true, amount: 0.3 });

  // Group days into week columns starting on Sunday.
  const weeks = useMemo(() => {
    const cols: (Contribution | null)[][] = [];
    if (!days.length) return cols;
    let col: (Contribution | null)[] = Array(parse(days[0].date).getUTCDay()).fill(null);
    for (const day of days) {
      col.push(day);
      if (col.length === 7) {
        cols.push(col);
        col = [];
      }
    }
    if (col.length) cols.push(col);
    return cols;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let last = -1;
    weeks.forEach((week, i) => {
      const first = week.find(Boolean);
      if (!first) return;
      const month = parse(first.date).getUTCMonth();
      if (month !== last) {
        if (i < weeks.length - 2) labels.push({ index: i, label: MONTHS[month] });
        last = month;
      }
    });
    // Drop a label that would collide with the next one (a partial first month).
    return labels.filter((l, i) => !labels[i + 1] || labels[i + 1].index - l.index >= 3);
  }, [weeks]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const today = days.at(-1);
  const width = weeks.length * (CELL + GAP) - GAP;

  return (
    <div className="relative px-4 py-4">
      <div className="mb-3 flex justify-end">
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <span
            className={
              today && today.count > 0
                ? "size-1.5 rounded-full bg-green-500"
                : "size-1.5 rounded-full bg-muted-foreground/50"
            }
          />
          {today && today.count > 0
            ? `${today.count} contribution${today.count === 1 ? "" : "s"} today`
            : "Didn't code today"}
        </span>
      </div>

      <div ref={scroller} className="overflow-x-auto pb-2 [scrollbar-width:none]">
        <div className="mx-auto flex w-max gap-2">
          <div
            className="flex flex-col pt-5 font-mono text-[10px] text-muted-foreground"
            style={{ gap: GAP }}
          >
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                {d}
              </span>
            ))}
          </div>

          <div>
            <div className="relative mb-1.5 h-3.5 font-mono text-[10px] text-muted-foreground" style={{ width }}>
              {monthLabels.map((m) => (
                <span key={`${m.label}-${m.index}`} className="absolute" style={{ left: m.index * (CELL + GAP) }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex" style={{ gap: GAP }} onMouseLeave={() => setHover(null)}>
              {weeks.map((week, w) => (
                <div key={w} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, d) =>
                    day ? (
                      <span
                        key={day.date}
                        onMouseEnter={(e) => {
                          const box = (e.target as HTMLElement).getBoundingClientRect();
                          const parent = scroller.current!.parentElement!.getBoundingClientRect();
                          setHover({ day, x: box.left - parent.left + CELL / 2, y: box.top - parent.top });
                        }}
                        className="block rounded-[3px] transition-[opacity,scale] duration-300 hover:outline hover:outline-1 hover:outline-foreground/60"
                        style={{
                          width: CELL,
                          height: CELL,
                          background: `var(--graph-${day.level})`,
                          opacity: inView ? 1 : 0,
                          scale: inView ? 1 : 0.4,
                          transitionDelay: inView ? `${w * 8 + d * 10}ms` : "0ms",
                        }}
                      />
                    ) : (
                      <span key={`empty-${d}`} style={{ width: CELL, height: CELL }} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] whitespace-nowrap shadow-md"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <span className="text-foreground">
            {hover.day.count} contribution{hover.day.count === 1 ? "" : "s"}
          </span>{" "}
          <span className="text-muted-foreground">
            on{" "}
            {parse(hover.day.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
        <span>{total.toLocaleString("en-US")} contributions in the last year</span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="inline-block rounded-[3px]"
              style={{ width: CELL - 1, height: CELL - 1, background: `var(--graph-${l})` }}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
