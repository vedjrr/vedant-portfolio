import { Avatar } from "@/components/avatar";
import { FlipWords } from "@/components/flip-words";
import { ScrambleText } from "@/components/scramble-text";
import { GitHubIcon, VerifiedIcon } from "@/components/icons";
import { VisitorCounter } from "@/components/visitor-counter";
import { GITHUB_USER, profile } from "@/data/site";
import { getGitHubProfile } from "@/lib/github";

export async function ProfileHeader() {
  const gh = await getGitHubProfile();

  return (
    <div className="border-x border-edge">
      <div className="dot-pattern screen-line-after flex h-28 items-center justify-center sm:h-32">
        <p className="bg-background/80 px-2 text-center font-pixel text-sm leading-tight text-muted-foreground sm:text-base">
          {profile.banner[0]}
          <br />
          {profile.banner[1]}
        </p>
      </div>

      <div className="screen-line-after relative flex gap-4 px-4 py-4 sm:gap-6">
        {/* Corner crosses where the grid lines meet. */}
        <span aria-hidden="true" className="absolute -top-[7px] -left-[7px] font-mono text-xs leading-none text-border">+</span>
        <span aria-hidden="true" className="absolute -top-[7px] -right-[7px] font-mono text-xs leading-none text-border">+</span>

        <Avatar src={profile.avatar} alt={profile.name} />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <a
              href={`https://github.com/${GITHUB_USER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              title="Public repositories"
            >
              <GitHubIcon className="size-3.5" />
              {gh?.repos ?? ""}
            </a>
            <VisitorCounter />
          </div>

          <h1 className="font-pixel-line text-[26px] leading-tight tracking-tight sm:text-4xl">
            <ScrambleText text={profile.name} />
            <VerifiedIcon className="ml-2 inline size-5 align-[-2px] sm:size-6 sm:align-[-3px]" />
          </h1>

          <p className="font-mono text-sm text-muted-foreground">
            <FlipWords words={profile.flipWords} />
          </p>

          <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            {profile.status}
          </p>
        </div>
      </div>
    </div>
  );
}
