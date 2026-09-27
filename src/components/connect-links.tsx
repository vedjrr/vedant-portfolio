"use client";

import { Globe, Mail } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent } from "react";

import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import { type Social, socials } from "@/data/site";
import { haptic, useSound } from "@/hooks/use-sound";

const tints: Record<Social["icon"], string> = {
  github: "#39d353",
  linkedin: "#0a66c2",
  x: "var(--foreground)",
  mail: "#ea4335",
  globe: "#a855f7",
};

const icons = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  x: XIcon,
  mail: Mail,
  globe: Globe,
};

// How far a link leans toward the pointer, in px.
const PULL = 4;

export function ConnectLinks() {
  const tick = useSound("/audio/tick.wav");

  return (
    <motion.div
      className="flex flex-wrap gap-2 p-4"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ staggerChildren: 0.05 }}
    >
      {socials.map((s) => (
        <MagneticLink
          key={s.title}
          social={s}
          onClick={() => {
            tick({ volume: 0.35 });
            haptic(10);
          }}
        />
      ))}
    </motion.div>
  );
}

function MagneticLink({ social, onClick }: { social: Social; onClick: () => void }) {
  const Icon = icons[social.icon];
  const external = !social.href.startsWith("mailto:");
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - box.left) / box.width - 0.5) * 2 * PULL);
    y.set(((e.clientY - box.top) / box.height - 0.5) * 2 * PULL);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
        shown: { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
    >
      <motion.a
        href={social.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ x, y, ["--tint" as string]: tints[social.icon] }}
        className="group inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-sm text-muted-foreground shadow-xs transition-[color,background-color,border-color] hover:border-[color-mix(in_oklab,var(--tint)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--tint)_12%,transparent)] hover:text-foreground active:scale-95"
      >
        <Icon className="size-3.5 transition-colors group-hover:text-[var(--tint)]" />
        {social.title}
      </motion.a>
    </motion.div>
  );
}
