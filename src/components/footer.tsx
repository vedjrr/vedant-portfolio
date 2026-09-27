import { ArrowUpRight, History } from "lucide-react";

import { FooterClawd } from "@/components/footer-clawd";
import { profile, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="mx-auto max-w-3xl">
      <div className="screen-line-before screen-line-after flex items-end justify-between border-x border-edge px-4 py-5">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          © {new Date().getFullYear()} {profile.name}
          <br />
          Built with SQL, Swift and coffee
        </p>
        <FooterClawd />
      </div>
      <div className="dot-pattern flex h-24 items-center justify-center border-x border-edge">
        <a
          href={site.olderVersion}
          target="_blank"
          rel="noopener noreferrer"
          title="The previous, macOS-style version of this site"
          className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <History className="size-3.5" />
          Older versions
          <ArrowUpRight className="size-3" />
        </a>
      </div>
    </footer>
  );
}
