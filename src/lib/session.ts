import { cookies } from "next/headers";

import { GITHUB_USER } from "@/data/site";

// A signed-in guestbook visitor. Stored in a cookie signed with SESSION_SECRET
// (HMAC SHA-256), so it can't be edited. No GitHub token is kept.
export type Session = { id: number; login: string; name: string | null };

export const SESSION_COOKIE = "gb_session";
// Short-lived cookie that ties the GitHub callback to the sign-in that started it.
export const STATE_COOKIE = "gb_oauth_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function sealSession(session: Session) {
  const hmac = await key();
  if (!hmac) throw new Error("SESSION_SECRET is not set");
  const body = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString("base64url");
  const signature = await crypto.subtle.sign("HMAC", hmac, encoder.encode(body));
  return `${body}.${Buffer.from(signature).toString("base64url")}`;
}

export async function openSession(token: string | undefined): Promise<Session | null> {
  const hmac = await key();
  const [body, signature] = token?.split(".") ?? [];
  if (!hmac || !body || !signature) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    hmac,
    Buffer.from(signature, "base64url"),
    encoder.encode(body),
  );
  if (!valid) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as Session & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, login: data.login, name: data.name };
  } catch {
    return null;
  }
}

export async function getSession() {
  return openSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Moderators: GUESTBOOK_ADMINS (comma separated GitHub logins), or the site owner. */
export function isAdmin(session: Session | null) {
  if (!session) return false;
  const admins = (process.env.GUESTBOOK_ADMINS ?? GITHUB_USER)
    .split(",")
    .map((login) => login.trim().toLowerCase());
  return admins.includes(session.login.toLowerCase());
}
