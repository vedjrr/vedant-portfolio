import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("separator", className)} />;
}

export function Panel({
  id,
  title,
  action,
  children,
  className,
}: {
  id?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-14 border-x border-edge", className)}>
      {title && (
        <div className="screen-line-after flex items-center justify-between px-4">
          <h2 className="font-pixel-line text-3xl leading-[1.4] font-normal tracking-tight">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
