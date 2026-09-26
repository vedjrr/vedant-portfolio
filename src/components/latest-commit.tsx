"use client";

import { GitCommitHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { GitHubIcon } from "@/components/icons";
import { haptic, useSound } from "@/hooks/use-sound";
import type { LatestCommit } from "@/lib/github";

function timeAgo(date: string) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const units: [number, string][] = [
    [60 * 60 * 24 * 30, "mo"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, unit] of units) if (s >= size) return `${Math.floor(s / size)}${unit} ago`;
  return "just now";
}

export function LatestCommitCard({ commit }: { commit: LatestCommit }) {
  const [ago, setAgo] = useState<string | null>(null);
  const click = useSound("/audio/click.wav");

  useEffect(() => {
    const update = () => setAgo(timeAgo(commit.date));
    const first = window.setTimeout(update, 0);
    const id = window.setInterval(update, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [commit.date]);

  return (
    <div className="flex justify-center px-4 pb-5">
      <a
        href={commit.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          click({ volume: 0.35 });
          haptic(10);
        }}
        className="group flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-[0_0_0_4px_var(--brand-soft)]"
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <GitHubIcon className="size-6" />
          <span className="halo absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2 border-card bg-brand" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <GitCommitHorizontal className="size-3.5 text-brand" />
            Last pushed{ago ? ` · ${ago}` : ""}
          </span>
          <span className="block truncate font-medium">{commit.repo}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {commit.message} <span className="font-mono text-brand/80">{commit.sha}</span>
          </span>
        </span>
      </a>
    </div>
  );
}
