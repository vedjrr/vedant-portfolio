import { cn } from "@/lib/utils";

// Clawd, Claude Code's mascot, on the 18 x 5 pixel grid of its terminal logo.
// Eyes and legs are drawn on their own so they can blink, look and walk.
const BODY = [
  "000111111111111000",
  "000111111111111000",
  "011111111111111110",
  "000111111111111000",
];
const LEGS = [4, 6, 11, 13];
const EYES = [5, 12];

// Each row as [x, width] runs, so the body is a handful of rects.
const RUNS = BODY.map((row) =>
  [...row.matchAll(/1+/g)].map((m) => [m.index, m[0].length] as const),
);

export const CLAWD_ORANGE = "#d97757";

export type ClawdEyes = "open" | "half" | "closed";

export function ClawdSprite({
  eyes = "open",
  look = { x: 0, y: 0 },
  walking = false,
  blinking = false,
  className,
}: {
  eyes?: ClawdEyes;
  /** Pupil offset in grid pixels, about -0.4 to 0.4 on each axis. */
  look?: { x: number; y: number };
  walking?: boolean;
  blinking?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 18 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("clawd", walking && "clawd--walking", className)}
    >
      <g fill={CLAWD_ORANGE}>
        {RUNS.flatMap((runs, y) =>
          runs.map(([x, width]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={width} height="1" />
          )),
        )}
        {LEGS.map((x, i) => (
          <rect
            key={x}
            x={x}
            y="4"
            width="1"
            height="1"
            className={i % 2 ? "clawd-leg clawd-leg--b" : "clawd-leg"}
          />
        ))}
      </g>
      <g
        fill="#141413"
        className="clawd-look"
        style={{ transform: `translate(${look.x}px, ${look.y}px)` }}
      >
        {EYES.map((x) => (
          <rect
            key={x}
            x={x}
            y="1"
            width="1"
            height="1"
            data-eyes={eyes}
            className={cn("clawd-eye", blinking && eyes === "open" && "clawd-eye--blink")}
          />
        ))}
      </g>
    </svg>
  );
}
