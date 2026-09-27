import { NextResponse, type NextRequest } from "next/server";

import { STATE_COOKIE } from "@/lib/session";

/** Starts GitHub sign-in for the guestbook. Asks for no scopes: public profile only. */
export function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("Guestbook sign-in isn't set up yet.", { status: 503 });

  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set(
    "redirect_uri",
    new URL("/api/auth/github/callback", request.nextUrl.origin).toString(),
  );
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "true");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
