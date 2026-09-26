"use client";

import type { PointerEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Adds a green glow that follows the pointer across the card. */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - box.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - box.top}px`);
  };
  return (
    <div onPointerMove={onMove} className={cn("spotlight h-full rounded-xl", className)}>
      {children}
    </div>
  );
}
