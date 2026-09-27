import type { Metadata } from "next";

import { GuestbookBoard } from "@/components/guestbook-board";
import { Panel, Separator } from "@/components/section";
import { listMarks } from "@/lib/guestbook";

export const metadata: Metadata = {
  title: "Guestbook",
  description: "Sign the whiteboard or leave a note. No sign-in needed.",
};

export default async function GuestbookPage() {
  const marks = await listMarks();

  return (
    <>
      <Separator />
      <Panel title="Guestbook">
        <p className="screen-line-after px-4 py-3 font-mono text-sm leading-relaxed text-muted-foreground">
          Sign the board or leave a note anywhere on it. No sign-in. Draw with the pen, or pick
          text and click where your note goes. Everyone here sees it appear live.
        </p>
        {marks ? (
          <GuestbookBoard initial={marks} />
        ) : (
          <p className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_REALTIME_URL
              ? "The board is unavailable right now."
              : "The board opens soon."}
          </p>
        )}
      </Panel>
      <Separator />
    </>
  );
}
