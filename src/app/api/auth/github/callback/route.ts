import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE, STATE_COOKIE, sealSession } from "@/lib/session";

/** GitHub sends the visitor back here. Swap the code for their public profile, then sign them in. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const back = new URL("/guestbook", origin);

  const fail = (reason: string) => {
    back.searchParams.set("error", reason);
    const response = NextResponse.redirect(back);
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (!code || !state || state !== request.cookies.get(STATE_COOKIE)?.value) {
    return fail(searchParams.get("error") === "access_denied" ? "denied" : "state");
  }

  try {
    const token = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: new URL("/api/auth/github/callback", origin).toString(),
      }),
    }).then((res) => res.json() as Promise<{ access_token?: string }>);
    if (!token.access_token) return fail("github");

    const user = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token.access_token}`,
        "User-Agent": "vedant-portfolio-guestbook",
      },
    }).then((res) =>
      res.ok ? (res.json() as Promise<{ id: number; login: string; name: string | null }>) : null,
    );
    if (!user) return fail("github");

    const response = NextResponse.redirect(back);
    response.cookies.delete(STATE_COOKIE);
    response.cookies.set(
      SESSION_COOKIE,
      await sealSession({ id: user.id, login: user.login, name: user.name }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      },
    );
    return response;
  } catch {
    return fail("github");
  }
}
