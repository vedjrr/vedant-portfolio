import { ArrowRight, Quote } from "lucide-react";
import Link from "next/link";

import { ConnectLinks } from "@/components/connect-links";
import { ContributionGraph } from "@/components/contribution-graph";
import { EducationList } from "@/components/education-list";
import { LatestCommitCard } from "@/components/latest-commit";
import { ProfileHeader } from "@/components/profile-header";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { TechTag } from "@/components/tech-tag";
import { Panel, Separator } from "@/components/section";
import { education, profile, projects, quote, stack } from "@/data/site";
import { getContributions, getLatestCommit } from "@/lib/github";

export default async function Home() {
  const [contributions, latest] = await Promise.all([getContributions(), getLatestCommit()]);
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <ProfileHeader />
      <Separator />

      <Panel id="about" title="About">
        <Reveal>
          <ul className="list-disc space-y-3 py-4 pr-4 pl-9 font-mono text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
            {profile.about.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Reveal>
        {latest && <LatestCommitCard commit={latest} />}
      </Panel>
      <Separator />

      <Panel title="Connect">
        <ConnectLinks />
      </Panel>
      <Separator />

      <Panel id="github" title="GitHub Activity">
        {contributions ? (
          <ContributionGraph days={contributions.days} total={contributions.total} />
        ) : (
          <p className="p-4 font-mono text-sm text-muted-foreground">
            Activity is unavailable right now.
          </p>
        )}
      </Panel>
      <Separator />

      <Panel id="projects" title="Projects">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.08}>
              <ProjectCard project={p} priority={i < 2} />
            </Reveal>
          ))}
        </div>
        <div className="screen-line-before flex justify-center py-3">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Show all projects
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Panel>
      <Separator />

      <Panel id="stack" title="Stack">
        {stack.map((group, i) => (
          <div key={group.title} className="screen-line-after flex gap-4 px-4 py-3">
            <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <h3 className="mb-2 text-sm font-medium">{group.title}</h3>
              <ul className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <TechTag name={item} className="px-2 text-xs" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </Panel>
      <Separator />

      <Panel id="education" title="Education">
        <EducationList items={education} />
      </Panel>
      <Separator />

      <Panel>
        <Reveal>
          <figure className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <Quote aria-hidden="true" className="size-8 fill-muted-foreground/50 text-transparent" />
            <blockquote className="max-w-md text-xl leading-snug italic text-foreground/90">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3 text-xs tracking-widest text-muted-foreground uppercase">
              <span className="h-px w-8 bg-border" />
              {quote.author}
              <span className="h-px w-8 bg-border" />
            </figcaption>
          </figure>
        </Reveal>
      </Panel>
      <Separator />
    </>
  );
}
