// Guestbook notes live in the realtime Worker (see /worker). Reads are public;
// writes carry REALTIME_SECRET and only ever run on this site's server.

export type GuestbookEntry = {
  githubId: number;
  login: string;
  name: string | null;
  message: string;
  createdAt: number;
  hidden?: boolean;
};

export const MAX_MESSAGE = 120;

const BASE = process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/\/$/, "");

/** True once the Worker, GitHub sign-in and session secret are all configured. */
export function guestbookReady() {
  return Boolean(
    BASE &&
      process.env.REALTIME_SECRET &&
      process.env.SESSION_SECRET &&
      process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET,
  );
}

export async function listEntries({ includeHidden = false } = {}): Promise<GuestbookEntry[] | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/guestbook${includeHidden ? "?all" : ""}`, {
      cache: "no-store",
      headers: includeHidden ? { Authorization: `Bearer ${process.env.REALTIME_SECRET}` } : {},
    });
    return res.ok ? ((await res.json()) as GuestbookEntry[]) : null;
  } catch {
    return null;
  }
}

export async function writeEntry(
  method: "POST" | "DELETE" | "PATCH",
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  if (!BASE) return { ok: false, error: "The guestbook isn't set up yet." };
  try {
    const res = await fetch(`${BASE}/guestbook`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.REALTIME_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Something went wrong." };
  } catch {
    return { ok: false, error: "The guestbook is unreachable right now." };
  }
}
