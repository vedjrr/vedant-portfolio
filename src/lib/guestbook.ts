// The guestbook is a shared whiteboard stored in the realtime Worker (see
// /worker). Anyone can draw or leave a note without signing in. The Worker
// limits how much each visitor can add, and the site owner can erase marks.

// Board units: the board is BOARD_WIDTH wide on every screen and scales to fit.
// These four must match the Worker.
export const BOARD_WIDTH = 760;
export const BOARD_MAX_HEIGHT = 20_000;
export const MAX_POINTS = 600;
export const MAX_TEXT = 60;

// Marks store an index into this list, so ink follows the theme. The Worker
// accepts as many colours as there are here.
export const INKS = [
  { name: "Ink", value: "var(--foreground)" },
  { name: "Green", value: "var(--brand)" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
];

// points is flat: [x1, y1, x2, y2, ...].
export type Pen = { kind: "pen"; color: number; points: number[] };
export type Note = { kind: "text"; color: number; x: number; y: number; text: string };
export type Draft = Pen | Note;
export type Mark = Draft & { id: string };

const BASE = process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/\/$/, "");

export async function listMarks(): Promise<Mark[] | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/board`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Mark[]) : null;
  } catch {
    return null;
  }
}

/** Adds a mark. key is this browser's random key, which later lets it undo the mark. */
export async function addMark(
  draft: Draft,
  key: string,
): Promise<{ ok: true; mark: Mark } | { ok: false; error: string }> {
  if (!BASE) return { ok: false, error: "The board isn't set up yet." };
  try {
    const res = await fetch(`${BASE}/board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, key }),
    });
    const data = (await res.json().catch(() => ({}))) as { mark?: Mark; error?: string };
    return res.ok && data.mark
      ? { ok: true, mark: data.mark }
      : { ok: false, error: data.error ?? "That didn't save. Try again." };
  } catch {
    return { ok: false, error: "The board is unreachable right now." };
  }
}

/**
 * Removes a mark: your own with your key, or any with the site owner's admin
 * key. With everything, the owner removes every mark by the same visitor.
 */
export async function eraseMark(
  id: string,
  auth: { key: string } | { admin: string; everything?: boolean },
): Promise<{ status: number; ids: string[] }> {
  if (!BASE) return { status: 0, ids: [] };
  const admin = "admin" in auth;
  try {
    const res = await fetch(
      `${BASE}/board/${encodeURIComponent(id)}${admin && auth.everything ? "?visitor" : ""}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(admin ? { Authorization: `Bearer ${auth.admin}` } : {}),
        },
        body: admin ? undefined : JSON.stringify({ key: auth.key }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { ids?: string[] };
    return { status: res.status, ids: data.ids ?? [] };
  } catch {
    return { status: 0, ids: [] };
  }
}
