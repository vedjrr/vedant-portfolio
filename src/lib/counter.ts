import { counters } from "@/data/site";

/** Abacus endpoint for a counter: `hit` adds one, `get` reads, `stream` pushes changes (SSE). */
export function counterUrl(action: "hit" | "get" | "stream", key: string) {
  return `${counters.base}/${action}/${counters.namespace}/${key}`;
}

/** Adds one to a counter and resolves to the new total, or null if Abacus is unreachable. */
export function hitCounter(key: string, signal?: AbortSignal) {
  return fetch(counterUrl("hit", key), { signal })
    .then((res) => (res.ok ? (res.json() as Promise<{ value?: number }>) : null))
    .then((data) => (typeof data?.value === "number" ? data.value : null))
    .catch(() => null);
}
