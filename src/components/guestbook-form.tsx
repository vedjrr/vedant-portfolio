"use client";

import { useActionState, useState } from "react";

import { removeMyNote, signGuestbook, signOut, type SignState } from "@/app/guestbook/actions";
import { GitHubIcon } from "@/components/icons";
import type { GuestbookEntry } from "@/lib/guestbook";
import type { Session } from "@/lib/session";

const initialState: SignState = {};

export function GuestbookForm({
  session,
  mine,
  maxLength,
}: {
  session: Session | null;
  mine?: GuestbookEntry;
  maxLength: number;
}) {
  const [state, action, pending] = useActionState(signGuestbook, initialState);
  const [length, setLength] = useState(mine?.message.length ?? 0);

  if (!session) {
    return (
      <div className="screen-line-after flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <p className="font-mono text-sm text-muted-foreground">Sign in to leave your note.</p>
        <a
          href="/api/auth/github"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-sm text-background transition-opacity hover:opacity-85"
        >
          <GitHubIcon className="size-4" />
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="screen-line-after flex flex-col gap-2 px-4 py-4">
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <label htmlFor="guestbook-message">
          Signed in as <span className="text-foreground">@{session.login}</span>
        </label>
        <span className="tabular-nums" aria-live="polite">
          {length}/{maxLength}
        </span>
      </div>
      <textarea
        id="guestbook-message"
        name="message"
        rows={2}
        required
        maxLength={maxLength}
        defaultValue={mine?.message}
        onChange={(e) => setLength(e.target.value.length)}
        placeholder="Say hi, share what you're building, leave a pixel of yourself."
        className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:border-brand/60"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : mine ? "Update note" : "Sign the wall"}
        </button>
        {mine && (
          <button
            formAction={removeMyNote}
            formNoValidate
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Remove my note
          </button>
        )}
        <button
          formAction={signOut}
          formNoValidate
          className="ml-auto font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="font-mono text-xs text-red-500">
          {state.error}
        </p>
      ) : state.savedAt ? (
        <p role="status" className="font-mono text-xs text-brand">
          Saved. You&apos;re on the wall.
        </p>
      ) : null}
    </form>
  );
}
