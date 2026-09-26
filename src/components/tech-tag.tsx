import { techColor } from "@/lib/tech-colors";
import { cn } from "@/lib/utils";

export function TechTag({ name, className }: { name: string; className?: string }) {
  const color = techColor(name);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      style={{ ["--tag" as string]: color }}
    >
      <span className="size-1.5 rounded-full bg-[var(--tag)] shadow-[0_0_6px_var(--tag)]" />
      {name}
    </span>
  );
}
