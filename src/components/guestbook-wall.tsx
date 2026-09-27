"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { setNoteHidden } from "@/app/guestbook/actions";
import { ClawdSprite } from "@/components/clawd-sprite";
import { useRealtime } from "@/components/realtime-provider";
import type { GuestbookEntry } from "@/lib/guestbook";

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** The pixel wall: every note, newest first. New notes drop in live. */
export function GuestbookWall({
  initial,
  admin,
  selfId,
}: {
  initial: GuestbookEntry[];
  admin: boolean;
  selfId: number | null;
}) {
  const { presence, subscribe } = useRealtime();
  // Notes signed, edited (entry) or removed (null) since the page loaded.
  const [live, setLive] = useState<Record<number, GuestbookEntry | null>>({});

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type === "guestbook") setLive((l) => ({ ...l, [msg.entry.githubId]: msg.entry }));
        if (msg.type === "guestbook-remove") setLive((l) => ({ ...l, [msg.githubId]: null }));
      }),
    [subscribe],
  );

  const entries = useMemo(() => {
    const byId = new Map(initial.map((e) => [e.githubId, e]));
    for (const [key, entry] of Object.entries(live)) {
      const id = Number(key);
      if (entry) byId.set(id, entry);
      // Moderators keep seeing hidden notes; the page data marks them.
      else if (!admin) byId.delete(id);
    }
    return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  }, [initial, live, admin]);

  const count = entries.filter((e) => !e.hidden).length;

  return (
    <>
      <div className="screen-line-after flex items-center justify-between px-4 py-2 font-mono text-xs text-muted-foreground">
        <span className="tabular-nums">
          {count} {count === 1 ? "note" : "notes"}
        </span>
        {presence && (
          <span className="flex items-center gap-1.5" title="New notes appear as they're signed">
            <span className="halo size-1.5 rounded-full bg-brand" />
            Live
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
          <ClawdSprite eyes="closed" className="clawd-sleep h-6 w-auto" />
          <p className="font-mono text-sm text-muted-foreground">
            The wall is empty. Be the first to sign it.
          </p>
        </div>
      ) : (
        <ul className="grid gap-px bg-edge sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
          <AnimatePresence initial={false}>
            {entries.map((e) => (
              <motion.li
                key={e.githubId}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: e.hidden ? 0.45 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3 bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={`https://avatars.githubusercontent.com/u/${e.githubId}?s=16`}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="size-8 shrink-0 rounded-sm bg-muted [image-rendering:pixelated]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-pixel text-sm">
                      {e.name || e.login}
                      {e.githubId === selfId && <span className="ml-1.5 text-brand">you</span>}
                    </p>
                    <a
                      href={`https://github.com/${e.login}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      @{e.login}
                    </a>
                  </div>
                  <time
                    dateTime={new Date(e.createdAt).toISOString()}
                    className="shrink-0 self-start font-mono text-[11px] text-muted-foreground/70"
                  >
                    {day.format(e.createdAt)}
                  </time>
                </div>
                <p className="font-mono text-sm leading-relaxed break-words">{e.message}</p>
                {admin && (
                  <button
                    type="button"
                    onClick={() => void setNoteHidden(e.githubId, !e.hidden)}
                    className="self-start font-mono text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    {e.hidden ? "Hidden. Unhide" : "Hide"}
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
