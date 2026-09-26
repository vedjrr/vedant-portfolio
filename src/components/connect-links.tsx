"use client";

import { Globe, Mail } from "lucide-react";

import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { socials } from "@/data/site";
import { haptic, useSound } from "@/hooks/use-sound";

const icons = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  mail: Mail,
  globe: Globe,
};

export function ConnectLinks() {
  const tick = useSound("/audio/tick.wav");

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {socials.map((s) => {
        const Icon = icons[s.icon];
        const external = !s.href.startsWith("mailto:");
        return (
          <a
            key={s.title}
            href={s.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            onClick={() => {
              tick({ volume: 0.35 });
              haptic(10);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-sm text-muted-foreground shadow-xs transition-[color,background-color,transform] hover:bg-accent hover:text-foreground active:scale-95"
          >
            <Icon className="size-3.5" />
            {s.title}
          </a>
        );
      })}
    </div>
  );
}
