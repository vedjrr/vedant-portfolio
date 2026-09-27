"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { MAX_MESSAGE, writeEntry } from "@/lib/guestbook";
import { SESSION_COOKIE, getSession, isAdmin } from "@/lib/session";

export type SignState = { error?: string; savedAt?: number };

// Links invite spam, so notes are plain text only.
const LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|ru|cn|top|link|click|gg|me|co)\b/i;

export async function signGuestbook(_prev: SignState, form: FormData): Promise<SignState> {
  const session = await getSession();
  if (!session) return { error: "Sign in with GitHub first." };

  const message = String(form.get("message") ?? "")
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!message) return { error: "Write something first." };
  if (message.length > MAX_MESSAGE) return { error: `Keep it to ${MAX_MESSAGE} characters.` };
  if (LINK.test(message)) return { error: "Links aren't allowed on the wall." };

  const result = await writeEntry("POST", {
    githubId: session.id,
    login: session.login,
    name: session.name,
    message,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/guestbook");
  return { savedAt: Date.now() };
}

export async function removeMyNote() {
  const session = await getSession();
  if (!session) return;
  await writeEntry("DELETE", { githubId: session.id });
  revalidatePath("/guestbook");
}

/** Moderators only. A hidden note also stops that account from signing again. */
export async function setNoteHidden(githubId: number, hidden: boolean) {
  if (!Number.isSafeInteger(githubId) || !isAdmin(await getSession())) return;
  await writeEntry("PATCH", { githubId, hidden: hidden === true });
  revalidatePath("/guestbook");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  revalidatePath("/guestbook");
}
