import { profile } from "@/data/site";

// Sleeping cat loaf on a 20 x 11 pixel grid. 1 = fur, 2 = shading.
const CAT = [
  "01000100000000000000",
  "01101100000000000000",
  "01111100000000000000",
  "11111110000111111000",
  "12211221011111111110",
  "11111111111111111111",
  "11112111111111111111",
  "11111111111111111111",
  "01111111111111111111",
  "00111111111122222221",
  "00011111111111111110",
];

function PixelCat() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -top-4 left-4 flex font-pixel text-[9px] text-muted-foreground">
        <span className="cat-z absolute">z</span>
        <span className="cat-z absolute left-1.5">z</span>
        <span className="cat-z absolute left-3">z</span>
      </div>
      <svg viewBox="0 0 20 11" className="cat-body h-8 w-auto" shapeRendering="crispEdges">
        {CAT.flatMap((row, y) =>
          row.split("").map((c, x) =>
            c === "0" ? null : (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                className={c === "1" ? "fill-foreground" : "fill-muted-foreground/60"}
              />
            ),
          ),
        )}
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-3xl">
      <div className="screen-line-before screen-line-after flex items-end justify-between border-x border-edge px-4 py-5">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          © {new Date().getFullYear()} {profile.name}
          <br />
          Built with SQL, Swift and coffee
        </p>
        <PixelCat />
      </div>
      <div className="dot-pattern h-24 border-x border-edge" />
    </footer>
  );
}
