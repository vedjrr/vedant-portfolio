"use client";

import { ChevronsUpDown, GraduationCap } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { useRef, useState } from "react";

import type { Education } from "@/data/site";
import { useSound } from "@/hooks/use-sound";

export function EducationList({ items }: { items: Education[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <EducationItem
          key={item.school}
          item={item}
          latest={i === 0}
          last={i === items.length - 1}
        />
      ))}
    </div>
  );
}

function EducationItem({
  item,
  latest,
  last,
}: {
  item: Education;
  latest: boolean;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  const tick = useSound("/audio/tick.wav");
  const ref = useRef<HTMLDivElement>(null);
  // Fills the line down to the next dot as this entry scrolls up the screen.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });

  return (
    <div ref={ref} className="screen-line-after px-4 py-4">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-7 left-7 h-full w-px -translate-x-1/2 bg-border"
        >
          <motion.span
            className="block size-full origin-top bg-brand/70"
            style={{ scaleY: scrollYProgress }}
          />
        </span>
      )}
      <div className="mb-2 flex items-center gap-3">
        <span className="relative z-10 flex size-6 items-center justify-center">
          <span className={latest ? "halo size-1.5 rounded-full bg-brand" : "size-1.5 rounded-full bg-muted-foreground/60"} />
        </span>
        <h3 className="font-medium">{item.school}</h3>
        {latest && (
          <span className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 font-mono text-[10px] text-brand">
            Latest
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          tick({ volume: 0.35 });
        }}
        aria-expanded={open}
        className="group flex w-full items-start gap-3 text-left"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors group-hover:border-brand/40 group-hover:text-brand">
          <GraduationCap className="size-3.5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm">
            <span className="font-medium">{item.degree}</span>
            <span className="text-muted-foreground"> · {item.field}</span>
          </span>
          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{item.period}</span>
        </span>
        <ChevronsUpDown className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="ml-9 list-disc overflow-hidden pl-4 text-sm text-muted-foreground marker:text-muted-foreground/50"
          >
            {item.details.map((d) => (
              <li key={d} className="pt-2 leading-relaxed">
                {d}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
