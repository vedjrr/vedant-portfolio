"use client";

import { Command } from "cmdk";
import {
  ArrowUpRight,
  Copy,
  FolderGit2,
  Hash,
  Moon,
  NotebookPen,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { GitHubIcon, LinkedInIcon, Monogram, XIcon } from "@/components/icons";
import { useThemeSwitch } from "@/components/theme-toggle";
import { profile, site, socials } from "@/data/site";
import { haptic, useSound } from "@/hooks/use-sound";

const sections = [
  { id: "about", title: "About" },
  { id: "github", title: "GitHub Activity" },
  { id: "projects", title: "Projects" },
  { id: "stack", title: "Stack" },
  { id: "education", title: "Education" },
];

const aiPrompt = encodeURIComponent(
  `Summarise ${profile.name}'s portfolio at ${site.url} for a hiring manager.`,
);

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const toggleTheme = useThemeSwitch();
  const click = useSound("/audio/click.wav");
  const tick = useSound("/audio/tick.wav");

  const openRef = useRef(false);

  const setOpenWithSound = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(openRef.current) : next;
      if (value === openRef.current) return;
      openRef.current = value;
      tick({ volume: 0.4 });
      haptic(10);
      setOpen(value);
    },
    [tick],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpenWithSound((v) => !v);
      }
    };
    const onOpen = () => setOpenWithSound(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("portfolio:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portfolio:open-command", onOpen);
    };
  }, [setOpenWithSound]);

  const run = useCallback(
    (fn: () => void) => {
      openRef.current = false;
      setOpen(false);
      click({ volume: 0.4 });
      haptic(10);
      fn();
    },
    [click],
  );

  const goToSection = (id: string) =>
    run(() => {
      if (pathname !== "/") {
        router.push(`/#${id}`);
        return;
      }
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });

  const openUrl = (href: string) =>
    run(() => window.open(href, "_blank", "noopener"));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpenWithSound}
      label="Command menu"
      loop
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_150ms_ease-out]"
      contentClassName="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl outline-none data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(.2,.8,.2,1)]"
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input
          autoFocus
          placeholder="Type a command or search..."
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setOpenWithSound(false)}
          aria-label="Close"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <Command.List className="max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground">
        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        <Command.Group heading="Navigation">
          <Item icon={<Monogram className="h-2.5" />} onSelect={() => run(() => router.push("/"))}>
            Home
          </Item>
          <Item icon={<FolderGit2 />} onSelect={() => run(() => router.push("/projects"))}>
            Projects
          </Item>
          {process.env.NEXT_PUBLIC_REALTIME_URL && (
            <Item icon={<NotebookPen />} onSelect={() => run(() => router.push("/guestbook"))}>
              Guestbook
            </Item>
          )}
        </Command.Group>

        <Command.Group heading="Sections">
          {sections.map((s) => (
            <Item key={s.id} icon={<Hash />} onSelect={() => goToSection(s.id)}>
              {s.title}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading="Ask AI">
          <Item icon={<Sparkles />} onSelect={() => openUrl(`https://claude.ai/new?q=${aiPrompt}`)}>
            Open in Claude
          </Item>
          <Item icon={<Sparkles />} onSelect={() => openUrl(`https://chatgpt.com/?q=${aiPrompt}`)}>
            Open in ChatGPT
          </Item>
        </Command.Group>

        <Command.Group heading="Links">
          {socials.map((s) => (
            <Item
              key={s.title}
              icon={
                s.icon === "github" ? (
                  <GitHubIcon />
                ) : s.icon === "linkedin" ? (
                  <LinkedInIcon />
                ) : s.icon === "x" ? (
                  <XIcon />
                ) : (
                  <ArrowUpRight />
                )
              }
              onSelect={() => openUrl(s.href)}
            >
              {s.title}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading="General">
          <Item icon={<Moon />} shortcut="D" onSelect={() => run(toggleTheme)}>
            Toggle theme
          </Item>
          <Item
            icon={<Copy />}
            onSelect={() => run(() => void navigator.clipboard?.writeText(profile.email))}
          >
            Copy email
          </Item>
          <Item
            icon={<Zap />}
            onSelect={() =>
              run(() => {
                if (pathname !== "/") router.push("/");
                window.setTimeout(
                  () => window.dispatchEvent(new CustomEvent("portfolio:glitch-avatar")),
                  pathname !== "/" ? 400 : 150,
                );
              })
            }
          >
            Glitch avatar
          </Item>
        </Command.Group>
      </Command.List>

      <div className="flex h-10 items-center justify-between border-t border-border px-3 text-xs text-muted-foreground">
        <Monogram className="h-2.5 text-foreground" />
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            Go to page <Kbd>↵</Kbd>
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            Exit <Kbd>Esc</Kbd>
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function Item({
  icon,
  children,
  shortcut,
  onSelect,
}: {
  icon: ReactNode;
  children: ReactNode;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[11px] text-muted-foreground">
      {children}
    </kbd>
  );
}
