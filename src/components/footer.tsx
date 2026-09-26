import { profile } from "@/data/site";

// Sleeping cat loaf on a 24 x 12 pixel grid. 1 = fur, 2 = shading.
const CAT = [
  "010000010000000000000000",
  "011000110000000000000000",
  "011101110000000000000000",
  "011111110000000000000000",
  "111111111000011111110000",
  "112211221101111111111100",
  "111111111111111111111110",
  "111121111111111111111110",
  "011111111111111111111111",
  "001111111111111111111111",
  "000111111122222222211111",
  "000011111111111111111110",
];

function PixelCat() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -top-4 left-4 flex font-pixel text-[9px] text-muted-foreground">
        <span className="cat-z absolute">z</span>
        <span className="cat-z absolute left-1.5">z</span>
        <span className="cat-z absolute left-3">z</span>
      </div>
      <svg viewBox="0 0 24 12" className="cat-body h-8 w-auto" shapeRendering="crispEdges">
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
