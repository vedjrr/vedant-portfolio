import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { Panel, Separator } from "@/components/section";
import { projects } from "@/data/site";

export const metadata: Metadata = {
  title: "Projects",
  description: "Products, analytics work, case studies and experiments by Vedant Ambre.",
};

export default function ProjectsPage() {
  return (
    <>
      <Separator />
      <Panel title="Projects">
        <p className="screen-line-after px-4 py-3 font-mono text-sm leading-relaxed text-muted-foreground">
          Products, analytics work, case studies and experiments. Each one started as a question
          and ended as something that runs.
        </p>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.08}>
              <ProjectCard project={p} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      </Panel>
      <Separator />
    </>
  );
}
