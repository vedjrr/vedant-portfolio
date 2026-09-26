"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { haptic, useSound } from "@/hooks/use-sound";

export function Avatar({ src, alt }: { src: string; alt: string }) {
  const [glitching, setGlitching] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const play = useSound("/audio/click.wav");

  const glitch = useCallback(() => {
    window.clearTimeout(timer.current);
    setGlitching(false);
    // Restart the animation on the next frame so repeated clicks replay it.
    requestAnimationFrame(() => {
      setGlitching(true);
      play({ volume: 0.35 });
      haptic(20);
      timer.current = window.setTimeout(() => setGlitching(false), 540);
    });
  }, [play]);

  useEffect(() => {
    window.addEventListener("portfolio:glitch-avatar", glitch);
    return () => {
      window.removeEventListener("portfolio:glitch-avatar", glitch);
      window.clearTimeout(timer.current);
    };
  }, [glitch]);

  return (
    <div className="avatar-glitch relative shrink-0" data-glitching={glitching}>
      <button
        type="button"
        onClick={glitch}
        aria-label="Glitch avatar"
        className="avatar-glitch__trigger relative block overflow-hidden rounded-2xl border border-border bg-background p-1 shadow-sm ring-1 ring-edge ring-offset-2 ring-offset-background"
      >
        <span className="relative block size-24 overflow-hidden rounded-xl sm:size-36">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(min-width: 640px) 144px, 96px"
            className="object-cover select-none"
            draggable={false}
          />
          <span className="avatar-glitch__scanlines absolute inset-0" />
          <span className="avatar-glitch__rgb absolute inset-0" />
        </span>
      </button>
    </div>
  );
}
