"use client";

import { useCallback, useEffect, useRef } from "react";

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function load(src: string) {
  const audio = getContext();
  if (!audio) return Promise.resolve(null);
  let pending = buffers.get(src);
  if (!pending) {
    pending = fetch(src)
      .then((res) => res.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .catch(() => null);
    buffers.set(src, pending);
  }
  return pending;
}

/** Plays a short UI sound through Web Audio so rapid clicks overlap cleanly. */
export function useSound(src: string) {
  const srcRef = useRef(src);

  useEffect(() => {
    srcRef.current = src;
  }, [src]);

  return useCallback((opts: { volume?: number } = {}) => {
    const audio = getContext();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume();
    void load(srcRef.current).then((buffer) => {
      if (!buffer) return;
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      gain.gain.value = opts.volume ?? 0.5;
      source.buffer = buffer;
      source.connect(gain).connect(audio.destination);
      source.start();
    });
  }, []);
}

/** Short vibration on devices that support it. */
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignored: some browsers throw without a user gesture.
    }
  }
}
