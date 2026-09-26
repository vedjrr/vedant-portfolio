import { profile } from "@/data/site";

// Sleeping cat on a 16 x 9 pixel grid. 1 = outline, 2 = fill.
const CAT = [
  "0100010000000000",
  "0110110000000000",
  "0122210000011100",
  "1222221000122210",
  "1202021111222221",
  "1222222222222221",
  "0122222222222221",
  "0012222222222210",
  "0001111111111100",
];

function PixelCat() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -top-4 left-3 flex font-pixel text-[9px] text-muted-foreground">
        <span className="cat-z absolute">z</span>
        <span className="cat-z absolute left-1.5">z</span>
        <span className="cat-z absolute left-3">z</span>
      </div>
      <svg viewBox="0 0 16 9" className="cat-body h-7 w-auto" shapeRendering="crispEdges">
        {CAT.flatMap((row, y) =>
          row.split("").map((c, x) =>
            c === "0" ? null : (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                className={c === "1" ? "fill-foreground" : "fill-background"}
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
