import type { Metadata } from "next";

import { GuestbookForm } from "@/components/guestbook-form";
import { GuestbookWall } from "@/components/guestbook-wall";
import { Panel, Separator } from "@/components/section";
import { MAX_MESSAGE, guestbookReady, listEntries } from "@/lib/guestbook";
import { getSession, isAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Guestbook",
  description: "Sign the pixel wall. One note per GitHub account.",
};

const ERRORS: Record<string, string> = {
  denied: "GitHub sign-in was cancelled.",
  state: "That sign-in expired. Try again.",
  github: "GitHub didn't answer. Try again in a moment.",
};

export default async function GuestbookPage({ searchParams }: PageProps<"/guestbook">) {
  const session = await getSession();
  const admin = isAdmin(session);
  const [entries, { error }] = await Promise.all([
    listEntries({ includeHidden: admin }),
    searchParams,
  ]);
  const mine = session ? entries?.find((e) => e.githubId === session.id) : undefined;
  const notice = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <>
      <Separator />
      <Panel title="Guestbook">
        <p className="screen-line-after px-4 py-3 font-mono text-sm leading-relaxed text-muted-foreground">
          Leave a note on the wall. Sign in with GitHub, one note each, no links. Say what
          you&apos;re building, where you found this, or just hi.
        </p>
        {notice && (
          <p role="alert" className="screen-line-after px-4 py-2 font-mono text-xs text-red-500">
            {notice}
          </p>
        )}
        {guestbookReady() ? (
          <GuestbookForm session={session} mine={mine} maxLength={MAX_MESSAGE} />
        ) : (
          <p className="screen-line-after px-4 py-4 font-mono text-sm text-muted-foreground">
            Signing opens soon.
          </p>
        )}
        {entries ? (
          <GuestbookWall initial={entries} admin={admin} selfId={session?.id ?? null} />
        ) : (
          <p className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_REALTIME_URL
              ? "The wall is unavailable right now."
              : "The wall opens soon."}
          </p>
        )}
      </Panel>
      <Separator />
    </>
  );
}
