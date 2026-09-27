// Visitor count stored on Abacus (https://abacus.jasoncameron.dev), a free
// keyless counter. POST counts a visit, GET only reads the total.
const NAMESPACE = process.env.COUNTER_NAMESPACE ?? "vedantambre-portfolio";
const KEY = process.env.COUNTER_KEY ?? "visits";
const BASE = "https://abacus.jasoncameron.dev";
// Abacus held 8 real visits when the public count was set to start at 479.
const OFFSET = Number(process.env.COUNTER_OFFSET ?? 471);

async function counter(action: "hit" | "get") {
  const res = await fetch(`${BASE}/${action}/${NAMESPACE}/${KEY}`, { cache: "no-store" });
  if (res.status === 404) return OFFSET;
  if (!res.ok) throw new Error(`Counter responded ${res.status}`);
  const data = (await res.json()) as { value?: number };
  return (data.value ?? 0) + OFFSET;
}

function respond(action: "hit" | "get") {
  return counter(action)
    .then((count) => Response.json({ count }, { headers: { "Cache-Control": "no-store" } }))
    .catch(() => Response.json({ error: "Counter unavailable" }, { status: 502 }));
}

export function GET() {
  return respond("get");
}

export function POST() {
  return respond("hit");
}
