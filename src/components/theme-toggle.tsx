"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect } from "react";

import { haptic, useSound } from "@/hooks/use-sound";

/** Switches theme with a top-down wipe, a click sound and a haptic tap. */
export function useThemeSwitch() {
  const { setTheme } = useTheme();
  const play = useSound("/audio/click.wav");

  return useCallback(() => {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    haptic(35);
    play({ volume: 0.5 });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !document.startViewTransition) {
      setTheme(next);
      return;
    }
    document.startViewTransition(() => setTheme(next));
  }, [play, setTheme]);
}

export function ThemeToggle() {
  const toggle = useThemeSwitch();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      if (e.key === "d" && !e.metaKey && !e.ctrlKey && !e.altKey) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme (D)"
      title="Toggle theme (D)"
      className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground transition-transform hover:bg-accent active:scale-90"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
