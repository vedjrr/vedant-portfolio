import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { GitHubIcon } from "@/components/icons";
import { Spotlight } from "@/components/spotlight";
import { TechTag } from "@/components/tech-tag";
import type { Project } from "@/data/site";
import { cn } from "@/lib/utils";

const statusStyle: Record<Project["status"], { dot: string; pill: string }> = {
  Live: {
    dot: "bg-green-500 halo",
    pill: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  Built: { dot: "bg-sky-500", pill: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  "In progress": {
    dot: "bg-amber-500",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <Spotlight>
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/80 p-1.5 shadow-xs transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-edge bg-muted">
          {project.image ? (
            <Image
              src={project.image}
              alt={`${project.name} preview`}
              fill
              priority={priority}
              sizes="(min-width: 768px) 360px, 100vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="dot-pattern flex size-full items-center justify-center">
              <span className="font-pixel text-2xl text-muted-foreground">{project.name}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium leading-snug">{project.name}</h3>
              <p className="text-xs text-muted-foreground">{project.tagline}</p>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
                statusStyle[project.status].pill,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusStyle[project.status].dot)} />
              {project.status}
            </span>
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <li key={s}>
                <TechTag name={s} />
              </li>
            ))}
          </ul>

          <div className="mt-auto grid grid-cols-2 divide-x divide-border border-t border-border pt-2 text-sm">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                Live link <ArrowUpRight className="size-3.5" />
              </a>
            ) : (
              <span className="flex items-center justify-center py-1 text-muted-foreground/40">
                Live link
              </span>
            )}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub <GitHubIcon className="size-3.5" />
              </a>
            ) : (
              <span className="flex items-center justify-center py-1 text-muted-foreground/40">
                Private
              </span>
            )}
          </div>
        </div>
      </article>
    </Spotlight>
  );
}
