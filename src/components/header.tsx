"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Monogram } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { title: "Home", href: "/" },
  { title: "Projects", href: "/projects" },
  // Listed once the realtime Worker that stores the guestbook is configured.
  ...(process.env.NEXT_PUBLIC_REALTIME_URL ? [{ title: "Guestbook", href: "/guestbook" }] : []),
];

const noopSubscribe = () => () => {};

export function Header() {
  const pathname = usePathname();
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true,
  );
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/80 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_0_16px_0_rgb(0_0_0/0.08)] dark:shadow-[0_0_16px_0_black]",
      )}
    >
      <div className="screen-line-after mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 border-x border-edge px-2 sm:px-3">
        <Link href="/" aria-label="Home" className="px-1 py-2 text-foreground">
          <Monogram className="h-4" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 py-1 font-mono text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portfolio:open-command"))}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Open command menu"
          >
            <Search className="size-4" />
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded bg-background/70 px-1.5 py-0.5 font-sans text-[11px] shadow-inner">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="rounded bg-background/70 px-1.5 py-0.5 font-sans text-[11px] shadow-inner">
                K
              </kbd>
            </span>
          </button>

          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
