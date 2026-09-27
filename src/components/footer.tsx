import { FooterClawd } from "@/components/footer-clawd";
import { profile } from "@/data/site";

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
      <div className="dot-pattern h-24 border-x border-edge" />
    </footer>
  );
}
