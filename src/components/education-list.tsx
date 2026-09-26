"use client";

import { ChevronsUpDown, GraduationCap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { Education } from "@/data/site";
import { useSound } from "@/hooks/use-sound";

export function EducationList({ items }: { items: Education[] }) {
  return (
    <div>
      {items.map((item) => (
        <EducationItem key={item.school} item={item} />
      ))}
    </div>
  );
}

function EducationItem({ item }: { item: Education }) {
  const [open, setOpen] = useState(false);
  const tick = useSound("/audio/tick.wav");

  return (
    <div className="screen-line-after px-4 py-4">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex size-6 items-center justify-center">
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
        </span>
        <h3 className="font-medium">{item.school}</h3>
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
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
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
