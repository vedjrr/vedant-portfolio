import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { GitHubIcon } from "@/components/icons";
import { TechTag } from "@/components/tech-tag";
import type { Project } from "@/data/site";
import { cn } from "@/lib/utils";

const statusColor: Record<Project["status"], string> = {
  Live: "bg-green-500",
  Built: "bg-sky-500",
  "In progress": "bg-amber-500",
};

export function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xs transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
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
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", statusColor[project.status])} />
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
  );
}
