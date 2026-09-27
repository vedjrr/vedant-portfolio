"use client";

import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CountUp } from "@/components/count-up";
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

  const stats = useMemo(() => {
    let longest = 0;
    let run = 0;
    let best = days[0];
    let active = 0;
    for (const day of days) {
      run = day.count > 0 ? run + 1 : 0;
      longest = Math.max(longest, run);
      if (day.count > 0) active++;
      if (best && day.count > best.count) best = day;
    }
    // Today may not have a commit yet; the streak still counts from yesterday.
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) current++;
      else if (i !== days.length - 1) break;
    }
    return { longest, current, best, active };
  }, [days]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const today = days.at(-1);
  const width = weeks.length * (CELL + GAP) - GAP;

  return (
    <div className="relative px-4 py-4">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Contributions" value={total} hint="last 12 months" />
        <Stat label="Current streak" value={stats.current} suffix="d" hint="days in a row" />
        <Stat label="Longest streak" value={stats.longest} suffix="d" hint={`${stats.active} active days`} />
        <Stat
          label="Best day"
          value={stats.best?.count ?? 0}
          hint={
            stats.best
              ? parse(stats.best.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })
              : ""
          }
        />
      </div>

      <div className="mb-3 flex justify-end">
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <span
            className={
              today && today.count > 0
                ? "halo size-1.5 rounded-full bg-brand"
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
                        className="block rounded-[3px] transition-[background-color,scale] duration-500 hover:outline hover:outline-1 hover:outline-foreground/60"
                        style={{
                          width: CELL,
                          height: CELL,
                          // Empty grid first, then colour floods in as a diagonal wave.
                          background: inView ? `var(--graph-${day.level})` : "var(--graph-0)",
                          scale: inView ? 1 : 0.7,
                          transitionDelay: inView ? `${(w + d) * 14}ms` : "0ms",
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
        <span>Hover a square for the day · refreshed hourly</span>
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

function Stat({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <CountUp
        value={value}
        suffix={suffix}
        className="block font-pixel text-xl leading-tight text-brand tabular-nums"
      />
      <p className="font-mono text-[10px] text-muted-foreground/70">{hint}</p>
    </div>
  );
}
